/**
 * Vercel Blob image storage.
 *
 * Strategy:
 *   - Upload images on every /api/observe call
 *   - On 👍 feedback  → delete blobs (saves cost, answer was good)
 *   - On 👎 feedback  → keep blobs (needed for debugging bad answers)
 *   - No feedback     → keep blobs (cleanup can be added later via cron)
 *
 * If BLOB_READ_WRITE_TOKEN is not set (local dev without token),
 * uploads are silently skipped and [] is returned.
 */

import { put, del } from '@vercel/blob'

export async function uploadObservationImages(
  buffers: Buffer[],
  requestId: string,
): Promise<string[]> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn('[Blob] No BLOB_READ_WRITE_TOKEN — skipping image upload')
    return []
  }

  const uploads = buffers.map((buf, i) =>
    put(`observations/${requestId}/image-${i}.jpg`, buf, {
      access: 'public',
      contentType: 'image/jpeg',
    }),
  )

  try {
    const results = await Promise.all(uploads)
    return results.map((r) => r.url)
  } catch (err) {
    console.error('[Blob] Upload failed:', err)
    return []
  }
}

export async function deleteObservationImages(urls: string[]): Promise<void> {
  if (!urls.length || !process.env.BLOB_READ_WRITE_TOKEN) return
  try {
    await del(urls)
  } catch (err) {
    console.error('[Blob] Delete failed:', err)
  }
}
