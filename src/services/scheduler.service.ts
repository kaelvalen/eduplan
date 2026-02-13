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
import { parseTeacherWorkingHoursSafe } from '@/lib/time-utils';
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
  diagnostics?: any[]; // Detailed failure diagnostics
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
      teacherWorkingHours: parseTeacherWorkingHoursSafe(course.teacher?.workingHours),
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
        features: {
          enableSessionSplitting: true,      // Auto-split long sessions (e.g., 4h → 2h + 2h on same day)
          enableCombinedTheoryLab: true,     // Prefer theory+lab on same day
          enableBacktracking: true,          // Intelligent retry on failures
        },
      };

      // Generate schedule using async generator
      const generator = generateSchedule(config);

      // Manually iterate to get both progress AND final return value
      let schedule: any[] = [];
      let unscheduled: any[] = [];
      let diagnostics: any[] = [];
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
          diagnostics = result.value.diagnostics || [];
          console.log(`✅ Generator returned: ${schedule.length} schedules, ${unscheduled.length} unscheduled`);
          console.log(`📊 Diagnostics collected for ${diagnostics.length} failed courses`);
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
        diagnostics, // Detailed failure diagnostics for each failed course
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
    // Get all active courses with their sessions
    const activeCourses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        sessions: true,
      },
    });

    const totalActiveCourses = activeCourses.length;
    const totalActiveSessions = activeCourses.reduce(
      (sum, course) => sum + course.sessions.length,
      0
    );

    // Get all schedules for active courses
    const allSchedules = await prisma.schedule.findMany({
      where: {
        courseId: {
          in: activeCourses.map(c => c.id),
        },
      },
      select: {
        courseId: true,
        sessionHours: true,
      },
    });

    const totalScheduleItems = allSchedules.length;

    // Group schedules by course
    const schedulesByCourse = new Map<number, number>();
    for (const schedule of allSchedules) {
      const current = schedulesByCourse.get(schedule.courseId) || 0;
      schedulesByCourse.set(schedule.courseId, current + schedule.sessionHours);
    }

    // Calculate how many courses are fully scheduled
    let fullyScheduledCourses = 0;
    let totalRequiredHours = 0;
    let totalScheduledHours = 0;

    for (const course of activeCourses) {
      const requiredHours = course.sessions.reduce((sum, s) => sum + s.hours, 0);
      totalRequiredHours += requiredHours;

      // Calculate scheduled hours for this course
      const scheduledHours = schedulesByCourse.get(course.id) || 0;
      totalScheduledHours += scheduledHours;

      // Course is fully scheduled if scheduled hours >= required hours
      if (scheduledHours >= requiredHours) {
        fullyScheduledCourses++;
      }
    }

    // Completion percentage based on scheduled hours vs required hours
    const completionPercentage =
      totalRequiredHours > 0
        ? Math.round((totalScheduledHours / totalRequiredHours) * 100)
        : 0;

    return {
      completion_percentage: completionPercentage,
      total_active_courses: totalActiveCourses,
      total_active_sessions: totalActiveSessions,
      scheduled_sessions: totalScheduleItems,
      fully_scheduled_courses: fullyScheduledCourses,
      total_required_hours: totalRequiredHours,
      total_scheduled_hours: totalScheduledHours,
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
