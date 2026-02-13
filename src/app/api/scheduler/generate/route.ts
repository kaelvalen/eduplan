/**
 * Schedule Generation API Endpoint
 *
 * REFACTORED: Extracted 1300+ lines of business logic to SchedulerService
 * Route handler now focuses only on HTTP concerns (auth, validation, response formatting)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { schedulerService, type SchedulerOptions } from '@/services/scheduler.service';
import logger from '@/lib/logger';
import { z } from 'zod';

/**
 * Scheduler request schema
 */
const SchedulerOptionsSchema = z.object({
  preset: z.enum(['fast', 'default', 'quality']).optional(),
  maxIterations: z.number().min(10).max(1000).optional(),
  timeoutMs: z.number().min(5000).max(300000).optional(),
  optimizationEnabled: z.boolean().optional(),
}).optional();

/**
 * POST /api/scheduler/generate
 *
 * Generates a complete schedule for all active courses
 *
 * @requires Admin role
 * @body SchedulerOptions - Optional configuration (preset, maxIterations, etc.)
 * @returns Schedule result with metrics and conflicts
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    let options: SchedulerOptions = {};

    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json();
        const validated = SchedulerOptionsSchema.safeParse(body);

        if (!validated.success) {
          return NextResponse.json(
            { error: 'Invalid scheduler options', details: validated.error.format() },
            { status: 400 }
          );
        }

        options = validated.data || {};
      } catch (parseError) {
        // Empty body or invalid JSON - use defaults
        logger.warn('Failed to parse scheduler options, using defaults', { parseError });
      }
    }

    logger.info('Starting schedule generation', { userId: user.id, options });

    // Generate schedule using service
    const result = await schedulerService.generateFullSchedule(options);

    // Return successful response
    return NextResponse.json({
      success: result.success,
      message: result.success
        ? 'Program başarıyla oluşturuldu'
        : 'Program oluşturuldu ancak bazı çakışmalar var',
      schedules: result.schedules,
      metrics: result.metrics,
      conflicts: result.conflicts,
      unscheduledCourses: result.unscheduledCourses,
      warnings: result.warnings,
      processingTimeMs: result.processingTimeMs,
      diagnostics: result.diagnostics, // Detailed failure diagnostics
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Schedule generation failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: 'Schedule generation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scheduler/generate
 *
 * Not supported - use POST instead
 */
export async function GET() {
  return NextResponse.json(
    {
      error: 'Method not allowed',
      message: 'Use POST /api/scheduler/generate to generate a schedule',
    },
    { status: 405 }
  );
}
