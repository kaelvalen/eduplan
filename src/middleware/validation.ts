/**
 * Validation Middleware for API Routes
 * Validates request body against Zod schemas
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema, ZodError } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  details?: ValidationError[];
  statusCode: number;
}

/**
 * Validates request body against a Zod schema
 * Returns validated data or throws ValidationError
 */
export async function validateRequest<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<T> {
  try {
    const body = await request.json();
    
    // Log incoming request body for debugging
    console.log('📥 Incoming request body:', JSON.stringify(body, null, 2));
    
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors: ValidationError[] = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      console.error('❌ Zod Validation Failed:', validationErrors);

      throw {
        error: 'Geçersiz veri formatı',
        details: validationErrors,
        statusCode: 400,
      } as ApiError;
    }

    // Handle JSON parse errors
    console.error('❌ Request parsing error:', error);
    
    throw {
      error: 'İstek verisi okunamadı veya geçersiz JSON formatı',
      statusCode: 400,
    } as ApiError;
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): T {
  try {
    const { searchParams } = new URL(request.url);
    const query: any = {};

    searchParams.forEach((value, key) => {
      // Try to parse as JSON if possible (for arrays, objects)
      try {
        query[key] = JSON.parse(value);
      } catch {
        // Keep as string if not valid JSON
        query[key] = value;
      }
    });

    return schema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors: ValidationError[] = error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      throw {
        error: 'Geçersiz sorgu parametreleri',
        details: validationErrors,
        statusCode: 400,
      } as ApiError;
    }

    throw {
      error: 'Sorgu parametreleri okunamadı',
      statusCode: 400,
    } as ApiError;
  }
}

/**
 * Error response helper
 */
export function errorResponse(error: ApiError | Error | any): NextResponse {
  if ('statusCode' in error && 'error' in error) {
    const apiError = error as ApiError;
    return NextResponse.json(
      {
        error: apiError.error,
        ...(apiError.details && { details: apiError.details }),
      },
      { status: apiError.statusCode }
    );
  }

  // Handle known Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }

  // Generic error
  return NextResponse.json(
    { error: 'Bir hata oluştu' },
    { status: 500 }
  );
}

/**
 * Wrapper for API routes with validation
 * Automatically handles validation and error responses
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (request: NextRequest, validated: T) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const validated = await validateRequest(request, schema);
      return await handler(request, validated);
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/**
 * Wrapper for API routes with error handling only (no validation)
 */
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('API Error:', error);
      return errorResponse(error);
    }
  };
}
