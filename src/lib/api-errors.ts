/**
 * API Error Handling Utilities
 * Provides standardized error responses and error formatting
 */

import { NextResponse } from 'next/server';
import logger, { formatError, safeLogger } from './logger';

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: string;
  message: string;
  code?: string;
  details?: any;
  timestamp: string;
}

/**
 * Error codes for common scenarios
 */
export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',

  // Resources
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // CSRF
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',

  // Server
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: ErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  statusCode: number = 500,
  code?: ErrorCode
): NextResponse<ApiErrorResponse> {
  const formatted = formatError(error);

  const response: ApiErrorResponse = {
    error: formatted.name || 'Error',
    message: formatted.message || 'An unexpected error occurred',
    code: code || ErrorCode.INTERNAL_ERROR,
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development only
  if (process.env.NODE_ENV === 'development' && formatted.stack) {
    response.details = { stack: formatted.stack };
  }

  // Log the error (sanitized)
  safeLogger.error('API Error', {
    statusCode,
    code,
    message: formatted.message,
    stack: formatted.stack,
  });

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle API errors in a standardized way
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Handle custom ApiError
  if (error instanceof ApiError) {
    return createErrorResponse(error, error.statusCode, error.code);
  }

  // Handle Prisma errors
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return createErrorResponse(
          new Error('Bu kayıt zaten mevcut'),
          409,
          ErrorCode.DUPLICATE_ENTRY
        );

      case 'P2025': // Record not found
        return createErrorResponse(
          new Error('Kayıt bulunamadı'),
          404,
          ErrorCode.NOT_FOUND
        );

      case 'P2003': // Foreign key constraint failed
        return createErrorResponse(
          new Error('İlişkili kayıtlar nedeniyle işlem gerçekleştirilemedi'),
          409,
          ErrorCode.RESOURCE_CONFLICT
        );

      default:
        return createErrorResponse(
          new Error('Veritabanı hatası oluştu'),
          500,
          ErrorCode.DATABASE_ERROR
        );
    }
  }

  // Handle generic errors
  return createErrorResponse(error, 500, ErrorCode.INTERNAL_ERROR);
}

/**
 * Validation error response
 */
export function validationError(
  message: string,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: 'Validation Error',
      message,
      code: ErrorCode.VALIDATION_ERROR,
      details,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Unauthorized error response
 */
export function unauthorizedError(
  message: string = 'Unauthorized - Please login'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: 'Unauthorized',
      message,
      code: ErrorCode.UNAUTHORIZED,
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}

/**
 * Forbidden error response
 */
export function forbiddenError(
  message: string = 'Forbidden - Insufficient permissions'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: 'Forbidden',
      message,
      code: ErrorCode.FORBIDDEN,
      timestamp: new Date().toISOString(),
    },
    { status: 403 }
  );
}

/**
 * Not found error response
 */
export function notFoundError(
  message: string = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: 'Not Found',
      message,
      code: ErrorCode.NOT_FOUND,
      timestamp: new Date().toISOString(),
    },
    { status: 404 }
  );
}

/**
 * Rate limit error response
 */
export function rateLimitError(
  message: string = 'Too many requests',
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = NextResponse.json(
    {
      error: 'Rate Limit Exceeded',
      message,
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      timestamp: new Date().toISOString(),
    },
    { status: 429 }
  );

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}
