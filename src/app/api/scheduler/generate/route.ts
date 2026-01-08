import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getActiveCoursesForScheduler, getAllClassroomsForScheduler, deleteAllSchedules, createManySchedules } from '@/lib/turso-helpers';
import logger, { logSchedulerEvent } from '@/lib/logger';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_BLOCKS = [
  { start: '08:00', end: '09:30' },
  { start: '09:30', end: '11:00' },
  { start: '11:00', end: '12:30' },
  { start: '13:00', end: '14:30' },
  { start: '14:30', end: '16:00' },
  { start: '16:00', end: '17:30' },
];

interface ScheduleItem {
  courseId: number;
  classroomId: number;
  day: string;
  timeRange: string;
  sessionType: string;
  sessionHours: number;
}

interface CourseData {
  id: number;
  name: string;
  code: string;
  teacherId: number | null;
  faculty: string;
  level: string;
  totalHours: number;
  sessions: { type: string; hours: number }[];
  departments: { department: string; studentCount: number }[];
  teacherWorkingHours: Record<string, string[]>;
}

interface ClassroomData {
  id: number;
  name: string;
  capacity: number;
  type: string;
}

// Parse working hours JSON
function parseWorkingHours(workingHoursStr: string): Record<string, string[]> {
  try {
    return JSON.parse(workingHoursStr);
  } catch {
    return {};
  }
}

// Check if teacher is available at given time
function isTeacherAvailable(
  workingHours: Record<string, string[]>,
  day: string,
  timeBlock: { start: string; end: string }
): boolean {
  const dayKey = day.toLowerCase();
  const slots = workingHours[dayKey] || [];
  if (slots.length === 0) return true; // No restrictions

  // Check if any slot overlaps with the time block
  return slots.some((slot) => {
    const slotTime = slot.split(':').map(Number);
    const startTime = timeBlock.start.split(':').map(Number);
    const endTime = timeBlock.end.split(':').map(Number);

    const slotMinutes = slotTime[0] * 60 + slotTime[1];
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

// Find suitable classroom for a course session
function findSuitableClassroom(
  classrooms: ClassroomData[],
  sessionType: string,
  studentCount: number,
  occupiedClassrooms: Set<number>
): ClassroomData | null {
  const suitable = classrooms.filter((c) => {
    if (occupiedClassrooms.has(c.id)) return false;
    if (c.capacity < studentCount) return false;
    if (sessionType === 'lab' && c.type !== 'lab') return false;
    return true;
  });

  // Sort by capacity (prefer smaller rooms that fit)
  suitable.sort((a, b) => a.capacity - b.capacity);
  return suitable[0] || null;
}

// Check for conflicts
function hasConflict(
  schedule: ScheduleItem[],
  newItem: Omit<ScheduleItem, 'classroomId'>,
  courses: Map<number, CourseData>
): boolean {
  const course = courses.get(newItem.courseId);
  if (!course) return true;

  for (const item of schedule) {
    if (item.day !== newItem.day || item.timeRange !== newItem.timeRange) continue;

    const existingCourse = courses.get(item.courseId);
    if (!existingCourse) continue;

    // Same teacher conflict
    if (course.teacherId && course.teacherId === existingCourse.teacherId) {
      return true;
    }

    // Same department and level conflict
    const courseDepts = course.departments.map((d) => d.department);
    const existingDepts = existingCourse.departments.map((d) => d.department);
    const commonDepts = courseDepts.filter((d) => existingDepts.includes(d));

    if (commonDepts.length > 0 && course.level === existingCourse.level) {
      return true;
    }
  }

  return false;
}

// Genetic algorithm for schedule generation
async function generateScheduleGenetic(
  courses: CourseData[],
  classrooms: ClassroomData[]
): Promise<{ schedule: ScheduleItem[]; unscheduled: CourseData[] }> {
  const schedule: ScheduleItem[] = [];
  const unscheduled: CourseData[] = [];
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Track what's scheduled for each course
  const courseScheduledSessions = new Map<number, number>();

  // Sort courses by constraints (more constrained first)
  const sortedCourses = [...courses].sort((a, b) => {
    const aStudents = a.departments.reduce((sum, d) => sum + d.studentCount, 0);
    const bStudents = b.departments.reduce((sum, d) => sum + d.studentCount, 0);
    return bStudents - aStudents; // Higher student count first
  });

  for (const course of sortedCourses) {
    const totalStudents = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
    let sessionsScheduled = 0;

    for (const session of course.sessions) {
      let scheduled = false;

      // Try each day and time block
      for (const day of DAYS) {
        if (scheduled) break;

        // Check teacher availability
        if (!isTeacherAvailable(course.teacherWorkingHours, day, TIME_BLOCKS[0])) {
          continue;
        }

        for (const timeBlock of TIME_BLOCKS) {
          if (scheduled) break;

          const timeRange = `${timeBlock.start}-${timeBlock.end}`;

          // Check for conflicts
          if (hasConflict(schedule, { courseId: course.id, day, timeRange, sessionType: session.type, sessionHours: session.hours }, courseMap)) {
            continue;
          }

          // Find occupied classrooms at this time
          const occupiedClassrooms = new Set(
            schedule
              .filter((s) => s.day === day && s.timeRange === timeRange)
              .map((s) => s.classroomId)
          );

          // Find suitable classroom
          const classroom = findSuitableClassroom(
            classrooms,
            session.type,
            totalStudents,
            occupiedClassrooms
          );

          if (classroom) {
            schedule.push({
              courseId: course.id,
              classroomId: classroom.id,
              day,
              timeRange,
              sessionType: session.type,
              sessionHours: session.hours,
            });
            sessionsScheduled++;
            scheduled = true;
          }
        }
      }

      if (!scheduled) {
        // Could not schedule this session
      }
    }

    courseScheduledSessions.set(course.id, sessionsScheduled);

    if (sessionsScheduled < course.sessions.length) {
      unscheduled.push(course);
    }
  }

  return { schedule, unscheduled };
}

// POST /api/scheduler/generate - Generate schedule
export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 403 });
    }

    logSchedulerEvent({
      action: 'generate_schedule',
      status: 'started',
    });

    // Get active courses with their data
    const courses: CourseData[] = await getActiveCoursesForScheduler();

    // Get all classrooms
    const classrooms: ClassroomData[] = await getAllClassroomsForScheduler();

    if (courses.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Programlanacak aktif ders bulunamadı',
        scheduled_count: 0,
        unscheduled_count: 0,
        success_rate: 0,
        schedule: [],
        unscheduled: [],
        perfect: false,
      });
    }

    if (classrooms.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Derslik bulunamadı',
        scheduled_count: 0,
        unscheduled_count: courses.length,
        success_rate: 0,
        schedule: [],
        unscheduled: courses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          total_hours: c.totalHours,
          student_count: c.departments.reduce((sum, d) => sum + d.studentCount, 0),
          reason: 'Derslik yok',
        })),
        perfect: false,
      });
    }

    // Delete existing schedules
    await deleteAllSchedules();

    // Generate new schedule
    const { schedule, unscheduled } = await generateScheduleGenetic(courses, classrooms);

    // Save to database
    if (schedule.length > 0) {
      await createManySchedules(schedule.map((s) => ({
        day: s.day,
        timeRange: s.timeRange,
        courseId: s.courseId,
        classroomId: s.classroomId,
      })));
    }

    const totalSessions = courses.reduce((sum, c) => sum + c.sessions.length, 0);
    const scheduledCount = schedule.length;
    const successRate = totalSessions > 0 ? Math.round((scheduledCount / totalSessions) * 100) : 0;

    logSchedulerEvent({
      action: 'generate_schedule',
      status: 'success',
      duration: Date.now() - startTime,
      coursesProcessed: courses.length,
      scheduledCount,
    });

    return NextResponse.json({
      success: scheduledCount > 0,
      message: scheduledCount > 0
        ? `${scheduledCount} oturum başarıyla programlandı`
        : 'Hiçbir oturum programlanamadı',
      scheduled_count: scheduledCount,
      unscheduled_count: unscheduled.length,
      success_rate: successRate,
      schedule: schedule,
      unscheduled: unscheduled.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        total_hours: c.totalHours,
        student_count: c.departments.reduce((sum, d) => sum + d.studentCount, 0),
        reason: 'Uygun zaman/derslik bulunamadı',
      })),
      perfect: unscheduled.length === 0,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logSchedulerEvent({
      action: 'generate_schedule',
      status: 'failed',
      duration: Date.now() - startTime,
      error: errorMessage,
    });
    
    logger.error('Generate schedule error:', { error: errorMessage });
    
    return NextResponse.json(
      { detail: 'Program oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
