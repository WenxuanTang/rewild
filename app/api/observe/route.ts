import { NextRequest, NextResponse } from 'next/server'
import { identifyWithPlantNet } from '@/lib/plantnet'
import { generateNaturalistResponse } from '@/lib/openai-naturalist'

// 10s = Vercel Hobby (free). Upgrade to Pro for 60s if needed.
export const maxDuration = 10

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const imageFiles = formData.getAll('images') as File[]
    const location = (formData.get('location') as string | null) || undefined
    const notes    = (formData.get('notes')    as string | null) || undefined

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'No images provided.' }, { status: 400 })
    }

    // Convert File objects to Buffer + base64
    const imageBuffers: Buffer[] = []
    const imageBase64s: string[] = []

    for (const file of imageFiles.slice(0, 4)) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      imageBuffers.push(buffer)
      imageBase64s.push(buffer.toString('base64'))
    }

    // Step 1 — Plant identification (PlantNet, may return [] if key absent)
    const plantNetCandidates = await identifyWithPlantNet(imageBuffers)

    // Map to a clean public shape
    const speciesCandidates = plantNetCandidates.map((c) => ({
      name: c.commonName
        ? `${c.scientificName} (${c.commonName})`
        : c.scientificName,
      scientificName: c.scientificName,
      commonName: c.commonName,
      family: c.family,
      confidence: c.score,
    }))

    // Step 2 — Naturalist explanation (OpenAI)
    const naturalistExplanation = await generateNaturalistResponse(
      plantNetCandidates,
      imageBase64s,
      location,
      notes,
    )

    return NextResponse.json({
      species_candidates: speciesCandidates,
      naturalist_explanation: naturalistExplanation,
      identified_by_vision: plantNetCandidates.length === 0,
    })
  } catch (err) {
    console.error('[/api/observe]', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
