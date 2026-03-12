import { NextRequest, NextResponse } from 'next/server'
import { identifyWithPlantNet } from '@/lib/plantnet'
import { generateNaturalistResponse } from '@/lib/openai-naturalist'
import { checkRateLimit } from '@/lib/rate-limit'
import { newRequestId, logObservation, logError } from '@/lib/logger'
import { uploadObservationImages } from '@/lib/blob-storage'

// 10s = Vercel Hobby (free). Upgrade to Pro for 60s if needed.
export const maxDuration = 10

/* ── Limits ─────────────────────────────────────────────── */
const MAX_IMAGES      = 4
const MAX_IMAGE_BYTES = 5 * 1024 * 1024   // 5 MB per image
const MAX_TOTAL_BYTES = 10 * 1024 * 1024  // 10 MB total
const RATE_LIMIT      = 20                // requests per hour per IP

/* ── Handler ─────────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  const requestId = newRequestId()
  const startMs   = Date.now()

  // ── Rate limiting ──────────────────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
           ?? request.headers.get('x-real-ip')
           ?? 'unknown'

  const rl = checkRateLimit(ip, RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.' },
      {
        status: 429,
        headers: {
          'Retry-After':           String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          'X-RateLimit-Limit':     String(RATE_LIMIT),
          'X-RateLimit-Remaining': '0',
        },
      },
    )
  }

  try {
    const formData  = await request.formData()
    const imageFiles = formData.getAll('images') as File[]
    const location   = (formData.get('location') as string | null) || undefined
    const notes      = (formData.get('notes')    as string | null) || undefined

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'No images provided.' }, { status: 400 })
    }

    // ── Image size validation ──────────────────────────────
    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES} images allowed.` },
        { status: 400 },
      )
    }

    let totalBytes = 0
    for (const file of imageFiles) {
      if (file.size > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: `Each image must be under ${MAX_IMAGE_BYTES / 1024 / 1024} MB.` },
          { status: 400 },
        )
      }
      totalBytes += file.size
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: `Total upload must be under ${MAX_TOTAL_BYTES / 1024 / 1024} MB.` },
        { status: 400 },
      )
    }

    // ── Convert files to Buffer + base64 ──────────────────
    const imageBuffers: Buffer[] = []
    const imageBase64s: string[] = []

    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      imageBuffers.push(buffer)
      imageBase64s.push(buffer.toString('base64'))
    }

    // ── Step 1 & 2 in parallel: PlantNet ID + Blob upload ─
    const [plantNetCandidates, blobUrls] = await Promise.all([
      identifyWithPlantNet(imageBuffers),
      uploadObservationImages(imageBuffers, requestId),
    ])

    const speciesCandidates = plantNetCandidates.map((c) => ({
      name:           c.commonName ? `${c.scientificName} (${c.commonName})` : c.scientificName,
      scientificName: c.scientificName,
      commonName:     c.commonName,
      family:         c.family,
      confidence:     c.score,
    }))

    // ── Step 3: Naturalist explanation (LLM) ──────────────
    const naturalistExplanation = await generateNaturalistResponse(
      plantNetCandidates,
      imageBase64s,
      location,
      notes,
    )

    // ── Logging ────────────────────────────────────────────
    const usedVision = plantNetCandidates.length === 0
    logObservation({
      requestId,
      timestamp:  new Date().toISOString(),
      event:      'observation_complete',
      durationMs: Date.now() - startMs,
      blobUrls,
      userInput: {
        imageCount:  imageFiles.length,
        totalSizeKb: Math.round(totalBytes / 1024),
        location:    location ?? null,
        hasNotes:    Boolean(notes),
      },
      llmInput: {
        model:                  usedVision ? 'gpt-4o' : 'gpt-4o-mini',
        speciesCandidatesCount: plantNetCandidates.length,
        usedVision,
        promptChars:            JSON.stringify(plantNetCandidates).length,
      },
      llmOutput: {
        identificationReasoningChars: naturalistExplanation.identification_reasoning?.length ?? 0,
        guidedObservationsCount:      naturalistExplanation.guided_observations?.length ?? 0,
        ecologicalContextChars:       naturalistExplanation.ecological_context?.length ?? 0,
      },
    })

    return NextResponse.json({
      request_id:             requestId,
      blob_urls:              blobUrls,
      species_candidates:     speciesCandidates,
      naturalist_explanation: naturalistExplanation,
      identified_by_vision:   usedVision,
    })

  } catch (err) {
    logError({
      requestId,
      timestamp:  new Date().toISOString(),
      event:      'observation_error',
      error:      err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - startMs,
    })
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 })
  }
}
