import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import logger, { logSchedulerEvent } from '@/lib/logger';
import prisma from '@/lib/prisma';
import {
  getActiveCoursesForScheduler,
  getAllClassroomsForScheduler,
  createManySchedules,
  deleteNonHardcodedSchedules
} from '@/lib/turso-helpers';
import { DAYS_TR as DAYS, DAY_MAPPING } from '@/constants/time';

// Dynamic time block generation based on settings
interface TimeBlock {
  start: string;
  end: string;
}

interface TimeSettings {
  slotDuration: number;
  dayStart: string;
  dayEnd: string;
  lunchBreakStart: string;
  lunchBreakEnd: string;
}

function generateDynamicTimeBlocks(settings: TimeSettings): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const { slotDuration, dayStart, dayEnd, lunchBreakStart, lunchBreakEnd } = settings;
  
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const toTimeString = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  const startMinutes = toMinutes(dayStart);
  const endMinutes = toMinutes(dayEnd);
  const lunchStartMin = toMinutes(lunchBreakStart);
  const lunchEndMin = toMinutes(lunchBreakEnd);
  
  for (let current = startMinutes; current < endMinutes; current += slotDuration) {
    const blockEnd = current + slotDuration;
    
    // Skip if block overlaps with lunch break
    if (current < lunchEndMin && blockEnd > lunchStartMin) {
      continue;
    }
    
    blocks.push({
      start: toTimeString(current),
      end: toTimeString(blockEnd)
    });
  }
  
  return blocks;
}

async function getTimeSettings(): Promise<TimeSettings> {
  const settings = await prisma.systemSettings.findFirst();
  return {
    slotDuration: settings?.slotDuration ?? 60,
    dayStart: settings?.dayStart ?? '08:00',
    dayEnd: settings?.dayEnd ?? '18:00',
    lunchBreakStart: settings?.lunchBreakStart ?? '12:00',
    lunchBreakEnd: settings?.lunchBreakEnd ?? '13:00',
  };
}

interface ScheduleItem {
  courseId: number;
  classroomId: number;
  day: string;
  timeRange: string;
  sessionType: string;
  sessionHours: number;
  isHardcoded: boolean;
}

interface CourseData {
  id: number;
  name: string;
  code: string;
  teacherId: number | null;
  faculty: string;
  level: string;
  category: string; // "zorunlu" | "secmeli"
  semester: string; // "güz" | "bahar" etc.
  totalHours: number;
  capacityMargin: number; // Per-course capacity margin (0-30%)
  sessions: { type: string; hours: number }[];
  departments: { department: string; studentCount: number }[];
  teacherWorkingHours: Record<string, string[]>;
  hardcodedSchedules: {
    day: string;
    startTime: string;
    endTime: string;
    sessionType: string;
    classroomId: number | null;
  }[];
}

interface ClassroomData {
  id: number;
  name: string;
  capacity: number;
  type: string;
  priorityDept: string | null;
  availableHours: Record<string, string[]>;
  isActive: boolean;
}

// Parse JSON string to object
function parseJsonField<T>(jsonStr: string, defaultValue: T): T {
  try {
    const parsed = JSON.parse(jsonStr);
    return parsed as T;
  } catch {
    return defaultValue;
  }
}

// Check if teacher is available at given time
function isTeacherAvailable(
  workingHours: Record<string, string[]>,
  day: string,
  timeBlock: { start: string; end: string }
): boolean {
  // If no configuration is set at all (empty object), assume fully available
  if (Object.keys(workingHours).length === 0) return true;

  let slots = workingHours[day];

  // Try mapped key if direct access fails
  if (!slots) {
    const mappedDay = DAY_MAPPING[day];
    if (mappedDay) {
      slots = workingHours[mappedDay];
    }
  }

  // If configuration exists but this day has no slots or is undefined, assume UNAVAILABLE
  if (!slots || slots.length === 0) return false;

  // Check if the time block start is in the available slots
  return slots.includes(timeBlock.start);
}

// Check if classroom is available at given time
function isClassroomAvailable(
  availableHours: Record<string, string[]>,
  day: string,
  timeBlock: { start: string; end: string }
): boolean {
  // If no configuration is set at all (empty object), assume fully available
  if (Object.keys(availableHours).length === 0) return true;

  let slots = availableHours[day];

  // Try mapped key if direct access fails
  if (!slots) {
    const mappedDay = DAY_MAPPING[day];
    if (mappedDay) {
      slots = availableHours[mappedDay];
    }
  }

  // If configuration exists but this day has no slots or is undefined, assume UNAVAILABLE
  if (!slots || slots.length === 0) return false;

  return slots.includes(timeBlock.start);
}

// Find suitable classroom for a course session (supporting multiple blocks)
function findSuitableClassroomForBlocks(
  classrooms: ClassroomData[],
  sessionType: string,
  studentCount: number,
  occupiedClassroomsByBlock: Set<number>[], // Occupied classrooms for each time block
  courseCapacityMargin: number,
  courseDepartment: string,
  day: string,
  timeBlocks: { start: string; end: string }[]
): ClassroomData | null {
  // Calculate adjusted capacity with per-course margin
  const adjustedStudentCount = courseCapacityMargin > 0
    ? Math.ceil(studentCount * (1 - courseCapacityMargin / 100))
    : studentCount;

  const suitable = classrooms.filter((c) => {
    // Hard constraint: Check if classroom is active
    if (!c.isActive) return false;

    // Hard constraint: Check capacity (capacity >= student count)
    if (c.capacity < adjustedStudentCount) return false;

    // Check classroom type matching
    if (sessionType === 'lab' && c.type !== 'lab') return false;
    if (sessionType === 'teorik' && c.type === 'lab') return false;
    // 'tümü' can go to any classroom

    // Check availability and occupancy for ALL blocks
    for (let i = 0; i < timeBlocks.length; i++) {
      const block = timeBlocks[i];

      // Custom availability
      if (!isClassroomAvailable(c.availableHours, day, block)) return false;

      // Already occupied in this block
      if (occupiedClassroomsByBlock[i].has(c.id)) return false;
    }

    return true;
  });

  // Soft constraint sorting with priorities:
  // 1. Capacity margin minimization (most important)
  // 2. Department/faculty preference
  // 3. Large enrollment courses prefer large classrooms
  // 4. Penalize low enrollment courses using high-capacity classrooms
  suitable.sort((a, b) => {
    // Calculate capacity margin for each classroom
    const aMargin = a.capacity - adjustedStudentCount;
    const bMargin = b.capacity - adjustedStudentCount;
    
    // Priority 1: Minimize capacity margin (prefer smaller rooms that fit)
    // For courses with large enrollment (>= 50), slightly prefer larger rooms
    const isLargeEnrollment = studentCount >= 50;
    const capacityMarginDiff = aMargin - bMargin;
    
    // If margin difference is significant (>20% of student count), prioritize smaller margin
    const marginThreshold = Math.max(10, Math.ceil(studentCount * 0.2));
    if (Math.abs(capacityMarginDiff) > marginThreshold) {
      // For large enrollment, prefer slightly larger rooms (up to 30% margin)
      // For small enrollment, strictly minimize margin
      if (isLargeEnrollment) {
        // Large enrollment: prefer rooms with margin between 0 and 30% of enrollment
        const aOptimalMargin = aMargin >= 0 && aMargin <= Math.ceil(studentCount * 0.3);
        const bOptimalMargin = bMargin >= 0 && bMargin <= Math.ceil(studentCount * 0.3);
        
        if (aOptimalMargin && !bOptimalMargin) return -1;
        if (!aOptimalMargin && bOptimalMargin) return 1;
        
        // Within optimal range, prefer slightly larger (but still minimize)
        if (aOptimalMargin && bOptimalMargin) {
          // Slight preference for larger room within optimal range
          return aMargin - bMargin;
        }
        
        // Outside optimal range, minimize margin
        return aMargin - bMargin;
      } else {
        // Small enrollment: strictly minimize margin
        return aMargin - bMargin;
      }
    }
    
    // Priority 2: Department/faculty preference (secondary to capacity margin)
    const aHasPriority = a.priorityDept === courseDepartment;
    const bHasPriority = b.priorityDept === courseDepartment;

    if (aHasPriority && !bHasPriority) return -1;
    if (bHasPriority && !aHasPriority) return 1;

    // If same department preference, break tie with capacity margin
    if (Math.abs(capacityMarginDiff) > 0) {
      return aMargin - bMargin;
    }

    // Final tie-breaker: prefer smaller capacity if margins are very close
    return a.capacity - b.capacity;
  });

  return suitable[0] || null;
}

// Check for conflicts
function hasConflict(
  schedule: ScheduleItem[],
  newItem: Omit<ScheduleItem, 'classroomId' | 'isHardcoded'>,
  courses: Map<number, CourseData>
): boolean {
  const course = courses.get(newItem.courseId);
  if (!course) return true;

  for (const item of schedule) {
    if (item.day !== newItem.day || item.timeRange !== newItem.timeRange) continue;

    const existingCourse = courses.get(item.courseId);
    if (!existingCourse) continue;

    // Hard constraint: Same teacher conflict
    if (course.teacherId && course.teacherId === existingCourse.teacherId) {
      return true;
    }

    // Hard constraint: Same department and level conflict (for all courses)
    const courseDepts = course.departments.map((d) => d.department);
    const existingDepts = existingCourse.departments.map((d) => d.department);
    const commonDepts = courseDepts.filter((d) => existingDepts.includes(d));

    if (commonDepts.length > 0 && course.level === existingCourse.level) {
      return true;
    }

    // Hard constraint: Compulsory courses (zorunlu) cannot conflict if same semester and level
    if (
      course.category === 'zorunlu' &&
      existingCourse.category === 'zorunlu' &&
      course.semester === existingCourse.semester &&
      course.level === existingCourse.level &&
      commonDepts.length > 0
    ) {
      return true;
    }
  }

  return false;
}

// Process hardcoded schedules first
function processHardcodedSchedules(
  courses: CourseData[],
  classrooms: ClassroomData[]
): { schedule: ScheduleItem[]; processedSessionCount: Map<number, number> } {
  const schedule: ScheduleItem[] = [];
  const processedSessionCount = new Map<number, number>();

  for (const course of courses) {
    let count = 0;

    for (const hs of course.hardcodedSchedules) {
      const timeRange = `${hs.startTime}-${hs.endTime}`;

      // Find classroom if specified, otherwise use first available
      let classroomId = hs.classroomId;
      if (!classroomId) {
        const suitable = classrooms.find((c) => {
          if (!c.isActive) return false;

          // Update for hybrid support
          if (hs.sessionType === 'lab') {
            if (c.type !== 'lab' && c.type !== 'hibrit') return false;
          } else { // teorik or 'tümü'
            // teorik or 'tümü' sessions can't be in 'lab' only rooms
            if (c.type === 'lab') return false;
            // 'hibrit' and 'teorik' types are fine for 'teorik' or 'tümü' sessions
          }
          return true;
        });
        classroomId = suitable?.id || null;
      }

      if (classroomId) {
        schedule.push({
          courseId: course.id,
          classroomId,
          day: hs.day,
          timeRange,
          sessionType: hs.sessionType,
          sessionHours: 1,
          isHardcoded: true,
        });
        count++;
      }
    }

    if (count > 0) {
      processedSessionCount.set(course.id, count);
    }
  }

  return { schedule, processedSessionCount };
}

// Genetic algorithm for schedule generation
async function generateScheduleGenetic(
  courses: CourseData[],
  classrooms: ClassroomData[],
  TIME_BLOCKS: TimeBlock[]
): Promise<{ schedule: ScheduleItem[]; unscheduled: CourseData[] }> {
  // First, process hardcoded schedules
  const { schedule, processedSessionCount } = processHardcodedSchedules(courses, classrooms);
  const unscheduled: CourseData[] = [];
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Soft constraint: Track lecturer load for balanced scheduling
  const lecturerLoad = new Map<number, number>(); // teacherId -> total hours scheduled
  
  // Initialize lecturer load from hardcoded schedules
  for (const item of schedule) {
    const course = courseMap.get(item.courseId);
    if (course?.teacherId) {
      const currentLoad = lecturerLoad.get(course.teacherId) || 0;
      lecturerLoad.set(course.teacherId, currentLoad + 1);
    }
  }

  // Sort courses by constraints (more constrained first)
  // Consider lecturer load as a soft constraint in sorting
  const sortedCourses = [...courses].sort((a, b) => {
    const aStudents = a.departments.reduce((sum, d) => sum + d.studentCount, 0);
    const bStudents = b.departments.reduce((sum, d) => sum + d.studentCount, 0);
    
    // Primary sort: higher student count first (more constrained)
    if (Math.abs(aStudents - bStudents) > 5) {
      return bStudents - aStudents;
    }
    
    // Secondary sort: prefer courses with lecturers who have lower load (soft constraint for balance)
    if (a.teacherId && b.teacherId) {
      const aLoad = lecturerLoad.get(a.teacherId) || 0;
      const bLoad = lecturerLoad.get(b.teacherId) || 0;
      if (aLoad !== bLoad) {
        return aLoad - bLoad; // Lower load first (to balance)
      }
    }
    
    return 0;
  });

  for (const course of sortedCourses) {
    const totalStudents = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
    const mainDepartment = course.departments[0]?.department || '';

    // Get how many hours were already scheduled via hardcoded
    let hardcodedAndScheduledHours = processedSessionCount.get(course.id) || 0;

    // Determine remaining sessions to schedule
    // Logic: Sort sessions, assume hardcoded ones cover some parts, schedule the rest as blocks
    const allSessions = [...course.sessions].sort((a, b) => b.hours - a.hours);
    const sessionsToSchedule: { type: string, hours: number }[] = [];

    // Deduct hardcoded hours from sessions
    for (const sess of allSessions) {
      if (hardcodedAndScheduledHours >= sess.hours) {
        hardcodedAndScheduledHours -= sess.hours;
        continue; // Fully covered by hardcoded/scheduled
      }

      if (hardcodedAndScheduledHours > 0) {
        // Partially covered
        sessionsToSchedule.push({ type: sess.type, hours: sess.hours - hardcodedAndScheduledHours });
        hardcodedAndScheduledHours = 0;
      } else {
        // Not covered
        sessionsToSchedule.push(sess);
      }
    }

    // If no sessions left to schedule
    if (sessionsToSchedule.length === 0) continue;

    let courseFullyScheduled = true;
    const scheduledDays = new Set<string>(); // Track days used for this course

    for (const session of sessionsToSchedule) {
      let sessionScheduled = false;
      const duration = session.hours;

      // Shuffle days
      const shuffledDays = [...DAYS].sort(() => Math.random() - 0.5);

      for (const day of shuffledDays) {
        if (sessionScheduled) break;

        // Prefer different days for different session blocks of the same course (optional, but good for distribution)
        // If it's a new session needed and we already have a session on this day, skip if possible
        // But if forced, allow it. For now, strict check:
        // if (scheduledDays.has(day) && shuffledDays.some(d => !scheduledDays.has(d))) continue;

        // Find consecutive time blocks
        // We look for 'duration' number of consecutive blocks
        // Constraints:
        // 1. Must be consecutive indices in TIME_BLOCKS
        // 2. Must not span across gaps (like lunch break)
        // 3. Teacher must be available for ALL blocks
        // 4. No conflict for ALL blocks

        const possibleStartIndices = Array.from({ length: TIME_BLOCKS.length - duration + 1 }, (_, i) => i)
          .sort(() => Math.random() - 0.5);

        for (const startIndex of possibleStartIndices) {
          if (sessionScheduled) break;

          const currentBlocks: typeof TIME_BLOCKS[0][] = [];
          const blockRanges: string[] = [];
          let isValidSequence = true;

          // Validate sequence
          for (let i = 0; i < duration; i++) {
            const blockIndex = startIndex + i;
            const currentBlock = TIME_BLOCKS[blockIndex];
            const nextBlock = (i < duration - 1) ? TIME_BLOCKS[blockIndex + 1] : null;

            // Gap check (e.g. 12:00-13:00)
            if (nextBlock && currentBlock.end !== nextBlock.start) {
              isValidSequence = false;
              break;
            }

            currentBlocks.push(currentBlock);
            blockRanges.push(`${currentBlock.start}-${currentBlock.end}`);

            // Teacher availability
            if (!isTeacherAvailable(course.teacherWorkingHours, day, currentBlock)) {
              isValidSequence = false;
              break;
            }

            // Conflict check
            if (hasConflict(
              schedule,
              { courseId: course.id, day, timeRange: `${currentBlock.start}-${currentBlock.end}`, sessionType: session.type, sessionHours: 1 },
              courseMap
            )) {
              isValidSequence = false;
              break;
            }
          }

          if (!isValidSequence) continue;

          // Find a classroom that matches ALL blocks
          // Prepare occupied sets for each block
          const occupiedClassroomsByBlock: Set<number>[] = [];
          for (const range of blockRanges) {
            const occupied = new Set(
              schedule
                .filter(s => s.day === day && s.timeRange === range)
                .map(s => s.classroomId)
            );
            occupiedClassroomsByBlock.push(occupied);
          }

          const classroom = findSuitableClassroomForBlocks(
            classrooms,
            session.type,
            totalStudents,
            occupiedClassroomsByBlock,
            course.capacityMargin,
            mainDepartment,
            day,
            currentBlocks
          );

          if (classroom) {
            // Schedule all blocks
            for (let i = 0; i < duration; i++) {
              const block = currentBlocks[i];
              schedule.push({
                courseId: course.id,
                classroomId: classroom.id,
                day,
                timeRange: `${block.start}-${block.end}`,
                sessionType: session.type,
                sessionHours: 1,
                isHardcoded: false
              });
            }
            
            // Soft constraint: Update lecturer load for balanced scheduling
            if (course.teacherId) {
              const currentLoad = lecturerLoad.get(course.teacherId) || 0;
              lecturerLoad.set(course.teacherId, currentLoad + duration);
            }
            
            sessionScheduled = true;
            scheduledDays.add(day);
          }
        }
      }

      if (!sessionScheduled) {
        courseFullyScheduled = false;
      }
    }

    if (!courseFullyScheduled) {
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
    const courses = await getActiveCoursesForScheduler();

    // Get all active classrooms
    const classrooms = await getAllClassroomsForScheduler();

    if (courses.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Programlanacak aktif ders bulunamadı (Turso)',
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
        message: 'Aktif derslik bulunamadı',
        scheduled_count: 0,
        unscheduled_count: courses.length,
        success_rate: 0,
        schedule: [],
        unscheduled: courses.map((c) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          total_hours: c.totalHours,
          student_count: (c.departments as any[]).reduce((sum, d) => sum + d.studentCount, 0),
          reason: 'Aktif derslik yok',
        })),
        perfect: false,
      });
    }

    // Delete existing non-hardcoded schedules
    await deleteNonHardcodedSchedules();

    // Get time settings and generate dynamic time blocks
    const timeSettings = await getTimeSettings();
    const TIME_BLOCKS = generateDynamicTimeBlocks(timeSettings);
    logger.info('Using dynamic time blocks:', { timeSettings, blockCount: TIME_BLOCKS.length });

    // Generate new schedule
    const { schedule, unscheduled } = await generateScheduleGenetic(courses as CourseData[], classrooms as ClassroomData[], TIME_BLOCKS);

    // Save to database
    if (schedule.length > 0) {
      await createManySchedules(
        schedule.map((s) => ({
          day: s.day,
          timeRange: s.timeRange,
          courseId: s.courseId,
          classroomId: s.classroomId,
          sessionType: s.sessionType,
        }))
      );
    }

    // Calculate total sessions
    const totalSessions = courses.reduce((sum, c) => {
      // Fix: cast c.sessions to any[] to avoid implicit any error
      return sum + (c.sessions as any[]).reduce((sSum, session) => sSum + session.hours, 0);
    }, 0);

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
        ? `${scheduledCount} saatlik ders başarıyla programlandı`
        : 'Hiçbir oturum programlanamadı',
      scheduled_count: scheduledCount,
      unscheduled_count: unscheduled.length,
      success_rate: successRate,
      schedule: schedule, // Schedule details (optional to return full list if large)
      unscheduled: unscheduled.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        total_hours: c.totalHours,
        student_count: (c.departments as any[]).reduce((sum, d) => sum + d.studentCount, 0),
        reason: 'Uygun zaman/derslik bulunamadı (Blok yerleştirme)',
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
      { detail: 'Program oluşturulurken bir hata oluştu: ' + errorMessage },
      { status: 500 }
    );
  }
}
