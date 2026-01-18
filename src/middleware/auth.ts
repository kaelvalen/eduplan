/**
 * Authentication Middleware for API Routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin as checkIsAdmin } from '@/lib/auth';
import type { User } from '@/types';

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
    };
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
    };
  }

  return user;
}

/**
 * Wrapper for authenticated routes
 */
export function withAuth(
  handler: (request: NextRequest, user: User, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request);
      return await handler(request, user, context);
    } catch (error: any) {
      if (error.statusCode) {
        return NextResponse.json(
          { error: error.error },
          { status: error.statusCode }
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
  handler: (request: NextRequest, user: User, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const user = await requireAdmin(request);
      return await handler(request, user, context);
    } catch (error: any) {
      if (error.statusCode) {
        return NextResponse.json(
          { error: error.error },
          { status: error.statusCode }
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
  schema: any,
  handler: (request: NextRequest, user: User, validated: T, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const user = await requireAuth(request);
      
      // Lazy import to avoid circular dependency
      const { validateRequest } = await import('./validation');
      const validated = await validateRequest(request, schema);
      
      return await handler(request, user, validated, context);
    } catch (error: any) {
      const { errorResponse } = await import('./validation');
      return errorResponse(error);
    }
  };
}

/**
 * Combined wrapper for admin routes with validation
 */
export function withAdminAndValidation<T>(
  schema: any,
  handler: (request: NextRequest, user: User, validated: T, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const user = await requireAdmin(request);
      
      // Lazy import to avoid circular dependency
      const { validateRequest } = await import('./validation');
      const validated = await validateRequest(request, schema);
      
      return await handler(request, user, validated, context);
    } catch (error: any) {
      const { errorResponse } = await import('./validation');
      return errorResponse(error);
    }
  };
}
