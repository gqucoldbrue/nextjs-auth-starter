// src/lib/rate-limit.ts
import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Create Redis instance
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Create rate limiter
export const rateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // Default values
  analytics: true,
})

// Rate limit middleware
export async function rateLimitMiddleware(
  request: Request,
  maxRequests: number,
  window: string
) {
  try {
    // Get IP address from request
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1'
    
    // Create identifier for this route
    const route = new URL(request.url).pathname
    const identifier = `${ip}:${route}`

    // Check rate limit
    const { success, limit, reset, remaining } = await rateLimit.limit(identifier)

    // Return rate limit information
    return {
      success,
      limit,
      reset,
      remaining,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open - allow request if rate limiting fails
    return {
      success: true,
      headers: {},
    }
  }
}
