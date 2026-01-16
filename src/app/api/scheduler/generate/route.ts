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
    
    // Prevent block overflow: if block would extend past dayEnd, don't create it
    // This handles edge cases like dayEnd=17:15, slot=60 where 16:00-17:00 is valid but 17:00-18:00 would overflow
    if (blockEnd > endMinutes) {
      break;
    }
    
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

  // Soft constraint sorting with deterministic size_ratio approach
  // Replaces magic number (50) with ratio-based calculation
  // Priority 1: Size ratio optimization (0.7-0.9 ideal, <0.4 penalty)
  // Priority 2: Department/faculty preference
  // Note: MIN_ACCEPTABLE_SCORE can be added in future if we want to reject very poor matches
  const MIN_ACCEPTABLE_SCORE = -500; // Below this, classroom is severely mismatched (optional filter)
  
  suitable.sort((a, b) => {
    // Calculate size_ratio = student_count / classroom_capacity
    const aRatio = adjustedStudentCount / a.capacity;
    const bRatio = adjustedStudentCount / b.capacity;
    
    // Ideal range: 0.7 - 0.9 (70%-90% utilization)
    const IDEAL_MIN = 0.7;
    const IDEAL_MAX = 0.9;
    const PENALTY_THRESHOLD = 0.4; // Below 40% utilization = inefficient
    
    // Score each classroom based on ratio
    const scoreRatio = (ratio: number): number => {
      if (ratio >= IDEAL_MIN && ratio <= IDEAL_MAX) {
        // Ideal range: prefer slightly higher utilization
        return 100 - Math.abs(ratio - 0.8) * 100; // Best at 0.8
      } else if (ratio < PENALTY_THRESHOLD) {
        // Too much waste: heavy penalty
        return ratio * 50; // Scale down significantly
      } else if (ratio > 1.0) {
        // Over capacity: shouldn't happen (hard constraint), but if it does, reject
        return -1000;
      } else {
        // Between 0.4-0.7 or 0.9-1.0: acceptable but not ideal
        if (ratio < IDEAL_MIN) {
          // 0.4-0.7: prefer closer to 0.7
          return 50 + (ratio - PENALTY_THRESHOLD) / (IDEAL_MIN - PENALTY_THRESHOLD) * 40;
        } else {
          // 0.9-1.0: prefer closer to 0.9
          return 100 - (ratio - IDEAL_MAX) / (1.0 - IDEAL_MAX) * 30;
        }
      }
    };
    
    const aScore = scoreRatio(aRatio);
    const bScore = scoreRatio(bRatio);
    
    // Priority 1: Higher score (better ratio) wins
    if (Math.abs(aScore - bScore) > 1) {
      return bScore - aScore; // Higher score first
    }
    
    // Priority 2: Department/faculty preference (secondary)
    const aHasPriority = a.priorityDept === courseDepartment;
    const bHasPriority = b.priorityDept === courseDepartment;

    if (aHasPriority && !bHasPriority) return -1;
    if (bHasPriority && !aHasPriority) return 1;

    // Final tie-breaker: prefer smaller capacity if scores are very close
    return a.capacity - b.capacity;
  });

  return suitable[0] || null;
}

// Check for conflicts
// Improved: Hardcoded schedules are treated as fixed nodes in conflict graph
// Zorunlu courses = hard constraint, Secmeli courses = soft constraint (should be avoided)
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

    // Hard constraint: Same teacher conflict (applies to all items, including hardcoded)
    if (course.teacherId && course.teacherId === existingCourse.teacherId) {
      return true;
    }

    // Hard constraint: Same classroom conflict (if same time)
    // This is implicitly checked but made explicit here
    // Classroom conflicts are handled by occupiedClassroomsByBlock

    const courseDepts = course.departments.map((d) => d.department);
    const existingDepts = existingCourse.departments.map((d) => d.department);
    const commonDepts = courseDepts.filter((d) => existingDepts.includes(d));

    if (commonDepts.length === 0) continue; // No common departments, no conflict

    // Hard constraint: Compulsory courses (zorunlu) cannot conflict if same semester and level
    // This is a HARD constraint - must not conflict
    if (
      course.category === 'zorunlu' &&
      existingCourse.category === 'zorunlu' &&
      course.semester === existingCourse.semester &&
      course.level === existingCourse.level
    ) {
      return true;
    }

    // Soft constraint: Seçmeli courses can conflict but should be avoided
    // This is handled by penalty in soft constraint scoring, not here
    // For now, we allow secmeli-secmeli conflicts (they can be optimized later)
    
    // Hard constraint: Same department and level conflict (for zorunlu courses only)
    // Seçmeli courses at same level can conflict (soft constraint - penalized but allowed)
    if (course.level === existingCourse.level && course.category === 'zorunlu') {
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

// Heuristic-based schedule generation with local improvement
// Production-grade heuristic scheduler (Smart Greedy + Randomized Heuristic + Hill Climbing)
async function generateScheduleHeuristic(
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

  // Calculate difficulty score for each course
  // Difficulty = student_count * 2 + (1 / available_class_count) * 5 + session_duration
  // Higher difficulty = schedule earlier (more constrained)
  const calculateDifficulty = (course: CourseData, classrooms: ClassroomData[]): number => {
    const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
    
    // Count available classrooms for this course's session types
    const sessionTypes = new Set(course.sessions.map(s => s.type));
    let availableClassCount = 0;
    for (const classroom of classrooms) {
      if (!classroom.isActive) continue;
      
      // Check if classroom can handle any of the course's session types
      const canHandle = Array.from(sessionTypes).some(type => {
        if (type === 'lab' && (classroom.type === 'lab' || classroom.type === 'hibrit')) return true;
        if (type === 'teorik' && classroom.type !== 'lab') return true;
        if (type === 'tümü') return true;
        return false;
      });
      
      // Also check capacity
      const adjustedStudentCount = course.capacityMargin > 0
        ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
        : studentCount;
      if (canHandle && classroom.capacity >= adjustedStudentCount) {
        availableClassCount++;
      }
    }
    
    // Calculate average session duration
    const totalSessionHours = course.sessions.reduce((sum, s) => sum + s.hours, 0);
    const avgSessionDuration = course.sessions.length > 0 ? totalSessionHours / course.sessions.length : 0;
    
    // Difficulty formula
    const difficulty = 
      studentCount * 2 +                                    // More students = harder
      (availableClassCount > 0 ? 1 / availableClassCount : 100) * 5 +  // Fewer available classes = harder
      avgSessionDuration;                                   // Longer sessions = harder
    
    return difficulty;
  };

  // Sort courses by difficulty (higher difficulty first = more constrained)
  // This ensures harder-to-schedule courses get priority
  const sortedCourses = [...courses].sort((a, b) => {
    const aDifficulty = calculateDifficulty(a, classrooms);
    const bDifficulty = calculateDifficulty(b, classrooms);
    
    // Primary sort: higher difficulty first
    const diffDiff = bDifficulty - aDifficulty;
    if (Math.abs(diffDiff) > 0.1) {
      return diffDiff > 0 ? 1 : -1;
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

  // Phase 2: Local Improvement (Hill Climbing)
  // Attempt to improve the schedule by swapping random course pairs
  // Accept swaps that improve soft constraint scores
  const IMPROVEMENT_ITERATIONS = 30; // 10-50 range, using 30 as balanced
  
  // Calculate soft constraint score for current schedule
  const calculateSoftScore = (currentSchedule: ScheduleItem[]): number => {
    let score = 0;
    const capacityUtilizations: number[] = [];
    const teacherLoads = new Map<number, number>();
    
    for (const item of currentSchedule) {
      const course = courseMap.get(item.courseId);
      if (!course) continue;
      
      const classroom = classrooms.find(c => c.id === item.classroomId);
      if (!classroom) continue;
      
      const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
      const adjustedStudentCount = course.capacityMargin > 0
        ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
        : studentCount;
      
      // Capacity utilization score (0.7-0.9 ideal = +10, <0.4 = -5)
      const utilization = adjustedStudentCount / classroom.capacity;
      capacityUtilizations.push(utilization);
      
      if (utilization >= 0.7 && utilization <= 0.9) {
        score += 10;
      } else if (utilization < 0.4) {
        score -= 5;
      }
      
      // Teacher load balance (tracked for stddev calculation)
      if (course.teacherId) {
        const currentLoad = teacherLoads.get(course.teacherId) || 0;
        teacherLoads.set(course.teacherId, currentLoad + item.sessionHours);
      }
    }
    
    // Penalize high variance in teacher loads (better balance = better score)
    const teacherLoadValues = Array.from(teacherLoads.values());
    if (teacherLoadValues.length > 1) {
      const avgLoad = teacherLoadValues.reduce((a, b) => a + b, 0) / teacherLoadValues.length;
      const variance = teacherLoadValues.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / teacherLoadValues.length;
      const stddev = Math.sqrt(variance);
      score -= stddev * 0.5; // Penalize high variance
    }
    
    return score;
  };
  
  let currentScore = calculateSoftScore(schedule);
  
  // Hill climbing iterations
  for (let iter = 0; iter < IMPROVEMENT_ITERATIONS; iter++) {
    // Select two random non-hardcoded schedule items to potentially swap
    const nonHardcodedItems = schedule.filter(s => !s.isHardcoded);
    if (nonHardcodedItems.length < 2) break;
    
    const idx1 = Math.floor(Math.random() * nonHardcodedItems.length);
    let idx2 = Math.floor(Math.random() * nonHardcodedItems.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(Math.random() * nonHardcodedItems.length);
    }
    
    const item1 = nonHardcodedItems[idx1];
    const item2 = nonHardcodedItems[idx2];
    
    // Find original indices in schedule array
    const origIdx1 = schedule.findIndex(s => s === item1);
    const origIdx2 = schedule.findIndex(s => s === item2);
    
    // Try swapping their time slots (day + timeRange)
    const tempDay = item1.day;
    const tempTimeRange = item1.timeRange;
    
    // Create temporary schedule with swap
    const tempSchedule = [...schedule];
    tempSchedule[origIdx1] = { ...item1, day: item2.day, timeRange: item2.timeRange };
    tempSchedule[origIdx2] = { ...item2, day: tempDay, timeRange: tempTimeRange };
    
    // Check if swap is valid (no conflicts)
    const course1 = courseMap.get(item1.courseId);
    const course2 = courseMap.get(item2.courseId);
    if (!course1 || !course2) continue;
    
    // Validate swap: check conflicts for both items at new times
    const conflict1 = hasConflict(
      tempSchedule.filter((_, i) => i !== origIdx1),
      { courseId: item1.courseId, day: item2.day, timeRange: item2.timeRange, sessionType: item1.sessionType, sessionHours: item1.sessionHours },
      courseMap
    );
    const conflict2 = hasConflict(
      tempSchedule.filter((_, i) => i !== origIdx2),
      { courseId: item2.courseId, day: tempDay, timeRange: tempTimeRange, sessionType: item2.sessionType, sessionHours: item2.sessionHours },
      courseMap
    );
    
    if (conflict1 || conflict2) continue;
    
    // Check classroom availability for swapped times
    const classroom1 = classrooms.find(c => c.id === item1.classroomId);
    const classroom2 = classrooms.find(c => c.id === item2.classroomId);
    if (!classroom1 || !classroom2) continue;
    
    const [time1] = item2.timeRange.split('-');
    const [time2] = tempTimeRange.split('-');
    const block1 = TIME_BLOCKS.find(b => b.start === time1);
    const block2 = TIME_BLOCKS.find(b => b.start === time2);
    if (!block1 || !block2) continue;
    
    // Check if classrooms are available at swapped times
    if (!isClassroomAvailable(classroom1.availableHours, item2.day, block1)) continue;
    if (!isClassroomAvailable(classroom2.availableHours, tempDay, block2)) continue;
    
    // Calculate new score
    const newScore = calculateSoftScore(tempSchedule);
    
    // Accept swap if score improves or stays same (hill climbing)
    if (newScore >= currentScore) {
      schedule[origIdx1] = tempSchedule[origIdx1];
      schedule[origIdx2] = tempSchedule[origIdx2];
      currentScore = newScore;
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
    const { schedule, unscheduled } = await generateScheduleHeuristic(courses as CourseData[], classrooms as ClassroomData[], TIME_BLOCKS);

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

    // Calculate advanced metrics
    const capacityMargins: number[] = [];
    let maxCapacityWaste = 0;
    const teacherLoads = new Map<number, number>();
    
    for (const item of schedule) {
      const course = courses.find(c => c.id === item.courseId);
      const classroom = (classrooms as ClassroomData[]).find(c => c.id === item.classroomId);
      
      if (course && classroom) {
        const studentCount = (course.departments as any[]).reduce((sum: number, d: any) => sum + d.studentCount, 0);
        const adjustedStudentCount = course.capacityMargin > 0
          ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
          : studentCount;
        
        // Capacity margin
        const margin = classroom.capacity - adjustedStudentCount;
        const marginPercent = classroom.capacity > 0 ? (margin / classroom.capacity) * 100 : 0;
        capacityMargins.push(marginPercent);
        
        // Capacity waste (unused capacity percentage)
        const wastePercent = classroom.capacity > 0 ? ((classroom.capacity - adjustedStudentCount) / classroom.capacity) * 100 : 0;
        maxCapacityWaste = Math.max(maxCapacityWaste, wastePercent);
        
        // Teacher load
        if (course.teacherId) {
          const currentLoad = teacherLoads.get(course.teacherId) || 0;
          teacherLoads.set(course.teacherId, currentLoad + item.sessionHours);
        }
      }
    }
    
    // Average capacity margin
    const avgCapacityMargin = capacityMargins.length > 0
      ? capacityMargins.reduce((a, b) => a + b, 0) / capacityMargins.length
      : 0;
    
    // Teacher load standard deviation
    const teacherLoadValues = Array.from(teacherLoads.values());
    let teacherLoadStddev = 0;
    if (teacherLoadValues.length > 1) {
      const avgLoad = teacherLoadValues.reduce((a, b) => a + b, 0) / teacherLoadValues.length;
      const variance = teacherLoadValues.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / teacherLoadValues.length;
      teacherLoadStddev = Math.sqrt(variance);
    }

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
      // Advanced metrics
      metrics: {
        avg_capacity_margin: Math.round(avgCapacityMargin * 10) / 10, // Round to 1 decimal
        max_capacity_waste: Math.round(maxCapacityWaste * 10) / 10,
        teacher_load_stddev: Math.round(teacherLoadStddev * 10) / 10,
      },
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
