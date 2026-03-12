import { NextRequest, NextResponse } from 'next/server'
import { deleteObservationImages } from '@/lib/blob-storage'
import { logFeedback } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { request_id, rating, blob_urls } = body as {
      request_id: string
      rating: 'helpful' | 'not_helpful'
      blob_urls: string[]
    }

    if (!request_id || !rating) {
      return NextResponse.json({ error: 'request_id and rating are required.' }, { status: 400 })
    }
    if (rating !== 'helpful' && rating !== 'not_helpful') {
      return NextResponse.json({ error: 'rating must be "helpful" or "not_helpful".' }, { status: 400 })
    }

    // 👍 Helpful → delete stored images (answer was good, no need to keep for debugging)
    // 👎 Not helpful → keep images (needed to understand why it went wrong)
    let blobsDeleted = false
    if (rating === 'helpful' && Array.isArray(blob_urls) && blob_urls.length > 0) {
      await deleteObservationImages(blob_urls)
      blobsDeleted = true
    }

    logFeedback({
      requestId:    request_id,
      timestamp:    new Date().toISOString(),
      event:        'user_feedback',
      rating,
      blobsDeleted,
    })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[/api/feedback]', err)
    return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 })
  }
}
