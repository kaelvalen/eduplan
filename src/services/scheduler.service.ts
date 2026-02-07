/**
 * Scheduler Service
 *
 * Centralized service for schedule generation and management.
 * Extracted from API route for better testability and reusability.
 *
 * REFACTORED: Moved 1300+ lines of business logic from route handler to service layer
 */

import { prisma } from '@/lib/db';
import {
  generateSchedule,
  calculateScheduleMetrics,
  generateDynamicTimeBlocks,
  type ScheduleItem,
  type SchedulerMetrics,
  type SchedulerConfig,
  type CourseData,
  type ClassroomData,
  type TimeSettings,
} from '@/lib/scheduler';
import logger, { logSchedulerEvent } from '@/lib/logger';

// SystemSettings is now imported as TimeSettings from scheduler types

// CourseForScheduler is now CourseData from scheduler types

// ClassroomForScheduler is now ClassroomData from scheduler types

// Simplified scheduler options (config presets removed from new API)
export interface SchedulerOptions {
  // Options can be added here if needed in future
}

export interface SchedulerResult {
  success: boolean;
  schedules: ScheduleItem[];
  metrics: SchedulerMetrics;
  conflicts: Array<{
    courseId: number;
    courseName: string;
    reason: string;
  }>;
  unscheduledCourses: Array<{
    id: number;
    name: string;
    reason: string;
  }>;
  warnings: string[];
  processingTimeMs: number;
}

export class SchedulerService {
  /**
   * Get system time settings from database
   */
  private async getTimeSettings(): Promise<TimeSettings> {
    const settings = await prisma.systemSettings.findFirst();
    return {
      slotDuration: settings?.slotDuration ?? 60,
      dayStart: settings?.dayStart ?? '09:30',
      dayEnd: settings?.dayEnd ?? '17:00',
      lunchBreakStart: settings?.lunchBreakStart ?? '12:00',
      lunchBreakEnd: settings?.lunchBreakEnd ?? '13:00',
    };
  }

  /**
   * Get active courses with all required relations for scheduling
   */
  private async getActiveCoursesForScheduler(): Promise<CourseData[]> {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        sessions: true,
        departments: true,
        hardcodedSchedules: true,
        teacher: {
          select: {
            id: true,
            workingHours: true,
          },
        },
      },
    });

    return courses.map((course) => ({
      id: course.id,
      name: course.name,
      code: course.code,
      teacherId: course.teacherId,
      faculty: course.faculty,
      level: course.level,
      category: course.category,
      semester: course.semester,
      totalHours: course.totalHours,
      capacityMargin: course.capacityMargin,
      sessions: course.sessions.map((s) => ({
        type: s.type,
        hours: s.hours,
      })),
      departments: course.departments.map((d) => ({
        department: d.department,
        studentCount: d.studentCount,
      })),
      teacherWorkingHours: course.teacher?.workingHours
        ? JSON.parse(course.teacher.workingHours)
        : {},
      hardcodedSchedules: course.hardcodedSchedules.map((h) => ({
        day: h.day,
        startTime: h.startTime,
        endTime: h.endTime,
        sessionType: h.sessionType,
        classroomId: h.classroomId,
      })),
    }));
  }

  /**
   * Get active classrooms for scheduling
   */
  private async getAllClassroomsForScheduler(): Promise<ClassroomData[]> {
    const classrooms = await prisma.classroom.findMany({
      where: { isActive: true },
    });

    return classrooms.map((c) => ({
      id: c.id,
      name: c.name,
      capacity: c.capacity,
      type: c.type,
      priorityDept: c.department || null,
      availableHours: c.availableHours ? JSON.parse(c.availableHours) : {},
      isActive: c.isActive,
    }));
  }

  // Removed deleteNonHardcodedSchedules and saveSchedules - now done inline in transaction

  /**
   * Main schedule generation method
   *
   * @param options - Scheduler configuration options
   * @returns Complete scheduler result with metrics and conflicts
   */
  async generateFullSchedule(
    options: SchedulerOptions = {}
  ): Promise<SchedulerResult> {
    const startTime = Date.now();

    try {
      // Log scheduler start
      logSchedulerEvent({
        action: 'generate',
        status: 'started',
      });

      // Get system settings
      const timeSettings = await this.getTimeSettings();

      // Get active courses and classrooms
      const [courses, classrooms] = await Promise.all([
        this.getActiveCoursesForScheduler(),
        this.getAllClassroomsForScheduler(),
      ]);

      logger.info('Scheduler data loaded', {
        courseCount: courses.length,
        classroomCount: classrooms.length,
      });

      // Generate time blocks from settings
      const timeBlocks = generateDynamicTimeBlocks(timeSettings);

      // Create scheduler configuration for new API
      const config: SchedulerConfig = {
        courses,
        classrooms,
        timeBlocks,
      };

      // Generate schedule using async generator
      const generator = generateSchedule(config);

      // Manually iterate to get both progress AND final return value
      let schedule: any[] = [];
      let unscheduled: any[] = [];
      let done = false;

      while (!done) {
        const result = await generator.next();
        done = result.done || false;

        if (!done && result.value) {
          // This is a progress update (yielded value)
          const progress = result.value;
          if (progress.stage !== 'complete') {
            logger.info(`Scheduler progress: ${progress.message}`, {
              stage: progress.stage,
              progress: progress.progress,
            });
          }
        } else if (done && result.value) {
          // This is the final return value
          schedule = result.value.schedule || [];
          unscheduled = result.value.unscheduled || [];
          console.log(`✅ Generator returned: ${schedule.length} schedules, ${unscheduled.length} unscheduled`);
        }
      }

      // Calculate metrics
      const metrics = calculateScheduleMetrics(schedule, courses, classrooms);

      // Save schedules in transaction (delete old + insert new)
      await prisma.$transaction(async (tx) => {
        // Delete old non-hardcoded schedules
        await tx.schedule.deleteMany({
          where: { isHardcoded: false },
        });

        // Save new schedules
        if (schedule.length > 0) {
          await tx.schedule.createMany({
            data: schedule.map((s: ScheduleItem) => ({
              day: s.day,
              timeRange: s.timeRange,
              courseId: s.courseId,
              classroomId: s.classroomId,
              sessionType: s.sessionType,
              sessionHours: s.sessionHours,
              isHardcoded: s.isHardcoded,
            })),
          });
        }
      }, {
        maxWait: 10000, // 10 seconds max wait
        timeout: 30000, // 30 seconds max transaction time (large batch insert)
      });

      const processingTimeMs = Date.now() - startTime;

      // Log completion
      logSchedulerEvent({
        action: 'generate',
        status: 'success',
        duration: processingTimeMs,
        scheduledCount: schedule.length,
        coursesProcessed: courses.length - unscheduled.length,
      });

      // Transform unscheduled courses to match result format
      const unscheduledCourses = unscheduled.map((course: CourseData) => ({
        id: course.id,
        name: course.name,
        reason: 'Uygun sınıf veya zaman bulunamadı',
      }));

      return {
        success: unscheduled.length === 0,
        schedules: schedule,
        metrics,
        conflicts: [], // New API doesn't track conflicts separately
        unscheduledCourses,
        warnings: [],
        processingTimeMs,
      };
    } catch (error) {
      const processingTimeMs = Date.now() - startTime;

      logger.error('Scheduler error', { error, processingTimeMs });
      logSchedulerEvent({
        action: 'generate',
        status: 'failed',
        duration: processingTimeMs,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Get current scheduler status (completion percentage, conflicts, etc.)
   */
  async getSchedulerStatus() {
    const [
      totalActiveCourses,
      totalActiveSessions,
      scheduledCount,
    ] = await Promise.all([
      prisma.course.count({ where: { isActive: true } }),
      prisma.courseSession.count({
        where: {
          course: { isActive: true },
        },
      }),
      prisma.schedule.count(),
    ]);

    const completionPercentage =
      totalActiveSessions > 0
        ? Math.round((scheduledCount / totalActiveSessions) * 100)
        : 0;

    return {
      completion_percentage: completionPercentage,
      total_active_courses: totalActiveCourses,
      total_active_sessions: totalActiveSessions,
      scheduled_sessions: scheduledCount,
      conflicts: 0, // TODO: Detect actual conflicts
    };
  }
}

/**
 * Singleton instance for convenience
 */
export const schedulerService = new SchedulerService();

/**
 * Default export
 */
export default schedulerService;
