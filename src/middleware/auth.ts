/**
 * Authentication Middleware for API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin as checkIsAdmin } from '@/lib/auth';
import type { User } from '@/types';
import type { ZodSchema } from 'zod';
import type { ApiError } from './validation';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Check if user is authenticated
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw {
      error: 'Yetkisiz erişim. Lütfen giriş yapın.',
      statusCode: 401,
    } as ApiError;
  }

  return user;
}

/**
 * Check if user is admin
 */
export async function requireAdmin(request: NextRequest): Promise<User> {
  const user = await requireAuth(request);

  if (!checkIsAdmin(user)) {
    throw {
      error: 'Bu işlem için yönetici yetkisi gereklidir.',
      statusCode: 403,
    } as ApiError;
  }

  return user;
}

/**
 * Wrapper for authenticated routes
 */
export function withAuth(
  handler: (request: NextRequest, user: User, context?: { params: Promise<unknown> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<unknown> }): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user, context);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        'error' in error
      ) {
        const apiError = error as ApiError;
        return NextResponse.json(
          { error: apiError.error },
          { status: apiError.statusCode }
        );
      }

      console.error('Auth error:', error);
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrapper for admin-only routes
 */
export function withAdmin(
  handler: (request: NextRequest, user: User, context?: { params: Promise<unknown> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<unknown> }): Promise<NextResponse> => {
    try {
      const user = await requireAdmin(request);
      return await handler(request, user, context);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        'error' in error
      ) {
        const apiError = error as ApiError;
        return NextResponse.json(
          { error: apiError.error },
          { status: apiError.statusCode }
        );
      }

      console.error('Auth error:', error);
      return NextResponse.json(
        { error: 'Yetkilendirme hatası' },
        { status: 500 }
      );
    }
  };
}

/**
 * Combined wrapper for authenticated routes with validation
 */
export function withAuthAndValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, user: User, validated: T, context?: { params: Promise<unknown> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<unknown> }): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request);
      
      // Lazy import to avoid circular dependency
      const { validateRequest } = await import('./validation');
      const validated = await validateRequest(request, schema);
      
      return await handler(request, user, validated as T, context);
    } catch (error: unknown) {
      // Log validation errors to console for debugging
      const apiError = error as ApiError;
      if (apiError.statusCode === 400 && apiError.details) {
        console.error('❌ Validation Error:', apiError.error);
        console.error('📋 Details:', JSON.stringify(apiError.details, null, 2));
      } else {
        console.error('❌ Request Error:', error);
      }
      
      const { errorResponse } = await import('./validation');
      return errorResponse(error);
    }
  };
}

/**
 * Combined wrapper for admin routes with validation
 */
export function withAdminAndValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, user: User, validated: T, context?: { params: Promise<unknown> }) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Promise<unknown> }): Promise<NextResponse> => {
    try {
      const user = await requireAdmin(request);
      
      // Lazy import to avoid circular dependency
      const { validateRequest } = await import('./validation');
      const validated = await validateRequest(request, schema);
      
      return await handler(request, user, validated as T, context);
    } catch (error: unknown) {
       // Log validation errors to console for debugging
      const apiError = error as ApiError;
      if (apiError && apiError.statusCode === 400 && apiError.details) {
        console.error('❌ Validation Error:', apiError.error);
        console.error('📋 Details:', JSON.stringify(apiError.details, null, 2));
      } else {
        console.error('❌ Request Error:', error);
      }
      
      const { errorResponse } = await import('./validation');
      return errorResponse(error);
    }
  };
}
