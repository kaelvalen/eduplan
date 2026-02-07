/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Protects against CSRF attacks by validating tokens on state-changing operations.
 * Tokens are stored in HTTP-only cookies and must be included in request headers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const CSRF_TOKEN_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Generates a cryptographically secure CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Validates CSRF token from request header against cookie value
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  const cookieToken = request.cookies.get(CSRF_TOKEN_NAME)?.value;

  if (!headerToken || !cookieToken) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  return timingSafeEqual(headerToken, cookieToken);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Sets CSRF token in response cookie
 */
export function setCsrfTokenCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false, // Client needs to read this to send in headers
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Middleware wrapper that adds CSRF protection to a route handler
 *
 * @example
 * ```typescript
 * export const POST = withCsrf(async (request) => {
 *   // Your route logic here
 * });
 * ```
 */
export function withCsrf<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Only validate CSRF on state-changing methods
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const isValid = await validateCsrfToken(request);

      if (!isValid) {
        return NextResponse.json(
          {
            error: 'Invalid or missing CSRF token',
            code: 'CSRF_TOKEN_INVALID',
          },
          { status: 403 }
        );
      }
    }

    // CSRF token is valid or not required (GET request), proceed
    return handler(request, ...args);
  };
}

/**
 * Combined auth + CSRF middleware
 * Use this for protected endpoints that require authentication AND CSRF protection
 */
export function withAuthAndCsrf<T extends any[]>(
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Import auth middleware (lazy to avoid circular dependencies)
    const { getCurrentUser } = await import('@/lib/auth');

    // Check authentication first
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Then validate CSRF for state-changing operations
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const isValid = await validateCsrfToken(request);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token', code: 'CSRF_TOKEN_INVALID' },
          { status: 403 }
        );
      }
    }

    return handler(request, user, ...args);
  };
}

/**
 * Combined admin + CSRF middleware
 * For admin-only endpoints that also require CSRF protection
 */
export function withAdminAndCsrf<T extends any[]>(
  handler: (request: NextRequest, user: any, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    // Import auth middleware (lazy to avoid circular dependencies)
    const { getCurrentUser, isAdmin } = await import('@/lib/auth');

    // Check authentication and admin role
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Validate CSRF for state-changing operations
    const method = request.method.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const isValid = await validateCsrfToken(request);

      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token', code: 'CSRF_TOKEN_INVALID' },
          { status: 403 }
        );
      }
    }

    return handler(request, user, ...args);
  };
}
