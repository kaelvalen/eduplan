/**
 * Streaming Scheduler API Route
 * Provides real-time progress updates during schedule generation
 */

import { NextRequest } from 'next/server';
import { requireAdmin } from '@/middleware';
import logger, { logSchedulerEvent } from '@/lib/logger';
import prisma from '@/lib/prisma';
import {
  generateSchedule,
  calculateScheduleMetrics,
  generateDynamicTimeBlocks,
  type SchedulerProgress,
} from '@/lib/scheduler';
import { courseService, classroomService } from '@/services';
import { deleteNonHardcodedSchedules, createManySchedules } from '@/lib/turso-helpers';

/**
 * GET /api/scheduler/generate-stream
 * Streams progress updates during schedule generation
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Authenticate user
    const user = await requireAdmin(request);

    logSchedulerEvent({
      action: 'generate_schedule_stream',
      status: 'started',
    });

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Get courses and classrooms
          const courses = await courseService.getActiveCoursesForScheduler();
          const classrooms = await classroomService.getActiveClassroomsForScheduler();

          // Initial validation
          if (courses.length === 0) {
            const errorProgress: SchedulerProgress = {
              stage: 'error',
              progress: 0,
              message: 'Programlanacak aktif ders bulunamadı',
            };
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(errorProgress)}\n\n`)
            );
            controller.close();
            return;
          }

          if (classrooms.length === 0) {
            const errorProgress: SchedulerProgress = {
              stage: 'error',
              progress: 0,
              message: 'Aktif derslik bulunamadı',
            };
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(errorProgress)}\n\n`)
            );
            controller.close();
            return;
          }

          // Delete existing non-hardcoded schedules
          await deleteNonHardcodedSchedules();

          // Get time settings and generate time blocks
          const timeSettings = await prisma.systemSettings.findFirst();
          const TIME_BLOCKS = generateDynamicTimeBlocks({
            slotDuration: timeSettings?.slotDuration ?? 60,
            dayStart: timeSettings?.dayStart ?? '08:00',
            dayEnd: timeSettings?.dayEnd ?? '18:00',
            lunchBreakStart: timeSettings?.lunchBreakStart ?? '12:00',
            lunchBreakEnd: timeSettings?.lunchBreakEnd ?? '13:00',
          });

          logger.info('Starting streaming schedule generation', {
            courseCount: courses.length,
            classroomCount: classrooms.length,
            timeBlockCount: TIME_BLOCKS.length,
          });

          // Generate schedule with progress updates
          const generator = generateSchedule({
            courses,
            classrooms,
            timeBlocks: TIME_BLOCKS,
          });

          let finalResult: any = null;

          for await (const progress of generator) {
            // Send progress update to client
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(progress)}\n\n`)
            );

            // Store final result
            if (progress.stage === 'complete') {
              finalResult = await generator.next();
            }
          }

          // Save schedule to database
          if (finalResult && finalResult.value) {
            const { schedule, unscheduled } = finalResult.value;

            if (schedule.length > 0) {
              await createManySchedules(
                schedule.map((s: any) => ({
                  day: s.day,
                  timeRange: s.timeRange,
                  courseId: s.courseId,
                  classroomId: s.classroomId,
                  sessionType: s.sessionType,
                }))
              );
            }

            // Calculate metrics
            const metrics = calculateScheduleMetrics(schedule, courses, classrooms);

            // Calculate success rate
            const totalSessions = courses.reduce((sum: number, c: any) => {
              return sum + c.sessions.reduce((sSum: number, session: any) => sSum + session.hours, 0);
            }, 0);

            const scheduledCount = schedule.length;
            const successRate = totalSessions > 0 ? Math.round((scheduledCount / totalSessions) * 100) : 0;

            // Send final result
            const finalProgress: SchedulerProgress & { result?: any } = {
              stage: 'complete',
              progress: 100,
              message: `Programlama tamamlandı! ${scheduledCount} oturum programlandı.`,
              scheduledCount,
              result: {
                success: scheduledCount > 0,
                scheduled_count: scheduledCount,
                unscheduled_count: unscheduled.length,
                success_rate: successRate,
                unscheduled: unscheduled.map((c: any) => ({
                  id: c.id,
                  name: c.name,
                  code: c.code,
                  total_hours: c.totalHours,
                  student_count: c.departments.reduce((sum: number, d: any) => sum + d.studentCount, 0),
                  reason: 'Uygun zaman/derslik bulunamadı',
                })),
                perfect: unscheduled.length === 0,
                metrics,
                duration: Date.now() - startTime,
              },
            };

            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify(finalProgress)}\n\n`)
            );

            logSchedulerEvent({
              action: 'generate_schedule_stream',
              status: 'success',
              duration: Date.now() - startTime,
              coursesProcessed: courses.length,
              scheduledCount,
            });
          }

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);

          const errorProgress: SchedulerProgress = {
            stage: 'error',
            progress: 0,
            message: `Hata: ${errorMessage}`,
          };

          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(errorProgress)}\n\n`)
          );

          logSchedulerEvent({
            action: 'generate_schedule_stream',
            status: 'failed',
            duration: Date.now() - startTime,
            error: errorMessage,
          });

          logger.error('Streaming schedule generation error:', { error: errorMessage });

          controller.close();
        }
      },
    });

    // Return stream response with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error('Streaming scheduler error:', { error: errorMessage });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
