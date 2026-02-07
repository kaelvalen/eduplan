/**
 * Rate Limiting Middleware
 *
 * Protects against brute force attacks and API abuse by limiting the number
 * of requests from a single IP address within a time window.
 *
 * NOTE: This is an in-memory implementation suitable for single-instance deployments.
 * For production with multiple instances, upgrade to Redis-based rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
  firstRequestAt: number;
}

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

// In-memory store for rate limit records
// Key format: "ip:endpoint"
const rateLimitStore = new Map<string, RateLimitRecord>();

// Cleanup expired records every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Gets the client IP address from the request
 */
function getClientIp(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to Vercel's IP header or x-forwarded-for
  return request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for') || 'unknown';
}

/**
 * Creates a rate limiter middleware
 *
 * @param config - Rate limit configuration
 * @returns Middleware function that can be used with route handlers
 *
 * @example
 * ```typescript
 * const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });
 * export const POST = limiter(async (request) => {
 *   // Your route logic
 * });
 * ```
 */
export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
  } = config;

  return function rateLimitMiddleware<T extends any[]>(
    handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
      const ip = getClientIp(request);
      const endpoint = new URL(request.url).pathname;
      const key = `${ip}:${endpoint}`;
      const now = Date.now();

      // Get or create record for this IP:endpoint combination
      let record = rateLimitStore.get(key);

      if (!record || now > record.resetAt) {
        // No record or expired record, create new one
        record = {
          count: 1,
          resetAt: now + windowMs,
          firstRequestAt: now,
        };
        rateLimitStore.set(key, record);
      } else {
        // Existing record, increment count
        record.count++;
      }

      // Check if limit exceeded
      if (record.count > maxRequests) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);

        return NextResponse.json(
          {
            error: message,
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': String(maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(record.resetAt / 1000)),
            },
          }
        );
      }

      // Execute the handler
      const response = await handler(request, ...args);

      // If configured to skip successful requests, decrement count for successful responses
      if (skipSuccessfulRequests && response.status < 400) {
        record.count--;
      }

      // Add rate limit headers to response
      response.headers.set('X-RateLimit-Limit', String(maxRequests));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(record.resetAt / 1000)));

      return response;
    };
  };
}

// ==================== PREDEFINED RATE LIMITERS ====================

/**
 * Strict rate limiter for authentication endpoints
 * Allows 5 login attempts per 15 minutes to prevent brute force attacks
 */
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  skipSuccessfulRequests: false, // Count all login attempts
});

/**
 * Moderate rate limiter for expensive operations like scheduler generation
 * Allows 3 generations per 5 minutes
 */
export const schedulerRateLimit = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 3,
  message: 'Too many schedule generation requests. Please wait before generating again.',
  skipSuccessfulRequests: true, // Only count failed/incomplete generations
});

/**
 * General API rate limiter
 * Allows 100 requests per minute for normal API usage
 */
export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  message: 'API rate limit exceeded. Please slow down your requests.',
  skipSuccessfulRequests: false,
});

/**
 * Strict rate limiter for password reset and sensitive operations
 * Allows 3 attempts per hour
 */
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many attempts. Please try again later.',
  skipSuccessfulRequests: false,
});

/**
 * Lenient rate limiter for read-only operations
 * Allows 200 requests per minute
 */
export const readRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 200,
  message: 'Too many requests. Please slow down.',
  skipSuccessfulRequests: false,
});

/**
 * Utility: Get current rate limit status for an IP:endpoint combination
 * Useful for monitoring and debugging
 */
export function getRateLimitStatus(ip: string, endpoint: string): {
  count: number;
  resetAt: number;
  remaining: number;
} | null {
  const key = `${ip}:${endpoint}`;
  const record = rateLimitStore.get(key);

  if (!record) {
    return null;
  }

  return {
    count: record.count,
    resetAt: record.resetAt,
    remaining: Math.max(0, record.resetAt - Date.now()),
  };
}

/**
 * Utility: Clear rate limit for a specific IP:endpoint (admin function)
 */
export function clearRateLimit(ip: string, endpoint: string): boolean {
  const key = `${ip}:${endpoint}`;
  return rateLimitStore.delete(key);
}

/**
 * Utility: Clear all rate limits (use with caution)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Utility: Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalKeys: number;
  activeKeys: number;
  expiredKeys: number;
} {
  const now = Date.now();
  let activeKeys = 0;
  let expiredKeys = 0;

  for (const record of rateLimitStore.values()) {
    if (now < record.resetAt) {
      activeKeys++;
    } else {
      expiredKeys++;
    }
  }

  return {
    totalKeys: rateLimitStore.size,
    activeKeys,
    expiredKeys,
  };
}
