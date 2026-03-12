/**
 * In-memory rate limiter.
 * Good enough for a single-instance POC / Vercel serverless (per-instance).
 * For multi-region prod: swap the Map for Upstash Redis.
 */

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

// Clean up expired buckets every 10 minutes to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, bucket] of store.entries()) {
      if (now > bucket.resetAt) store.delete(key)
    }
  }, 10 * 60 * 1000)
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number          // unix ms
}

/**
 * @param key       — typically the client IP
 * @param limit     — max requests per window (default: 20/hour)
 * @param windowMs  — window in ms (default: 1 hour)
 */
export function checkRateLimit(
  key: string,
  limit = 20,
  windowMs = 60 * 60 * 1000,
): RateLimitResult {
  const now = Date.now()
  const bucket = store.get(key)

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}
