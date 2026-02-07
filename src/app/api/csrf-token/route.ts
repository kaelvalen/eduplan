/**
 * CSRF Token Generation Endpoint
 *
 * Generates and returns a CSRF token for client-side requests.
 * The token is stored in an HTTP-only cookie and returned in the response.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfTokenCookie } from '@/middleware/csrf';

/**
 * GET /api/csrf-token
 *
 * Generates a new CSRF token for the client to use in subsequent requests.
 * The token is also set as an HTTP-only cookie for validation.
 *
 * @returns CSRF token in JSON response and cookie
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token
    const token = generateCsrfToken();

    // Create response with token
    const response = NextResponse.json(
      {
        csrfToken: token,
        expiresIn: 86400, // 24 hours in seconds
      },
      { status: 200 }
    );

    // Set token in cookie for validation
    setCsrfTokenCookie(response, token);

    return response;
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}
