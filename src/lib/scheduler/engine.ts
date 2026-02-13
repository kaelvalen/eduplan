/**
 * Scheduler Engine
 * Main scheduling algorithm with progress tracking
 */

import { DAYS_TR as DAYS } from '@/constants/time';
import { calculateDuration } from './time-utils';
import {
  isTeacherAvailable,
  hasConflict,
  findSuitableClassroomForBlocks,
  calculateCourseDifficulty,
  isClassroomAvailable,
} from './constraints';
import { ConflictIndex } from './conflict-index';
import { TimeoutManager } from './timeout';
import type {
  ScheduleItem,
  CourseData,
  ClassroomData,
  TimeBlock,
  SchedulerProgress,
  SchedulerConfig,
  SchedulerResult,
} from './types';

/**
 * Seedable Random Number Generator using Mulberry32
 * Provides deterministic random numbers for reproducible scheduling
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Fisher-Yates shuffle using seeded random
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Process hardcoded schedules first
 */
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
      const sessionHours = calculateDuration(hs.startTime, hs.endTime);

      let classroomId = hs.classroomId;
      if (!classroomId) {
        const suitable = classrooms.find((c) => {
          if (!c.isActive) return false;

          if (hs.sessionType === 'lab') {
            if (c.type !== 'lab' && c.type !== 'hibrit') return false;
          } else {
            if (c.type === 'lab') return false;
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
          sessionHours: sessionHours > 0 ? sessionHours : 1,
          isHardcoded: true,
        });
        count += sessionHours > 0 ? sessionHours : 1;
      }
    }

    if (count > 0) {
      processedSessionCount.set(course.id, count);
    }
  }

  return { schedule, processedSessionCount };
}

/**
 * Calculate soft constraint score for schedule quality
 */
function calculateSoftScore(
  currentSchedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classrooms: ClassroomData[]
): number {
  let score = 0;
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
    
    // Capacity utilization score
    const utilization = adjustedStudentCount / classroom.capacity;
    
    if (utilization >= 0.7 && utilization <= 0.9) {
      score += 10;
    } else if (utilization < 0.4) {
      score -= 5;
    }
    
    // Teacher load tracking
    if (course.teacherId) {
      const currentLoad = teacherLoads.get(course.teacherId) || 0;
      teacherLoads.set(course.teacherId, currentLoad + item.sessionHours);
    }
  }
  
  // Penalize high variance in teacher loads
  const teacherLoadValues = Array.from(teacherLoads.values());
  if (teacherLoadValues.length > 1) {
    const avgLoad = teacherLoadValues.reduce((a, b) => a + b, 0) / teacherLoadValues.length;
    const variance = teacherLoadValues.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / teacherLoadValues.length;
    const stddev = Math.sqrt(variance);
    score -= stddev * 0.5;
  }
  
  return score;
}

/**
 * Local improvement using hill climbing
 */
function performLocalImprovement(
  schedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classrooms: ClassroomData[],
  timeBlocks: TimeBlock[],
  rng: SeededRandom,
  iterations: number = 30
): void {
  let currentScore = calculateSoftScore(schedule, courseMap, classrooms);

  for (let iter = 0; iter < iterations; iter++) {
    const nonHardcodedItems = schedule.filter(s => !s.isHardcoded);
    if (nonHardcodedItems.length < 2) break;

    const idx1 = Math.floor(rng.next() * nonHardcodedItems.length);
    let idx2 = Math.floor(rng.next() * nonHardcodedItems.length);
    while (idx2 === idx1) {
      idx2 = Math.floor(rng.next() * nonHardcodedItems.length);
    }
    
    const item1 = nonHardcodedItems[idx1];
    const item2 = nonHardcodedItems[idx2];
    
    const origIdx1 = schedule.findIndex(s => s === item1);
    const origIdx2 = schedule.findIndex(s => s === item2);
    
    const tempDay = item1.day;
    const tempTimeRange = item1.timeRange;
    
    const tempSchedule = [...schedule];
    tempSchedule[origIdx1] = { ...item1, day: item2.day, timeRange: item2.timeRange };
    tempSchedule[origIdx2] = { ...item2, day: tempDay, timeRange: tempTimeRange };
    
    const course1 = courseMap.get(item1.courseId);
    const course2 = courseMap.get(item2.courseId);
    if (!course1 || !course2) continue;
    
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
    
    const classroom1 = classrooms.find(c => c.id === item1.classroomId);
    const classroom2 = classrooms.find(c => c.id === item2.classroomId);
    if (!classroom1 || !classroom2) continue;
    
    const [time1] = item2.timeRange.split('-');
    const [time2] = tempTimeRange.split('-');
    const block1 = timeBlocks.find(b => b.start === time1);
    const block2 = timeBlocks.find(b => b.start === time2);
    if (!block1 || !block2) continue;
    
    if (!isClassroomAvailable(classroom1.availableHours, item2.day, block1)) continue;
    if (!isClassroomAvailable(classroom2.availableHours, tempDay, block2)) continue;
    
    const newScore = calculateSoftScore(tempSchedule, courseMap, classrooms);
    
    if (newScore >= currentScore) {
      schedule[origIdx1] = tempSchedule[origIdx1];
      schedule[origIdx2] = tempSchedule[origIdx2];
      currentScore = newScore;
    }
  }
}

/**
 * Main scheduler engine with progress tracking
 * Yields progress updates throughout the scheduling process
 */
export async function* generateSchedule(
  config: SchedulerConfig
): AsyncGenerator<SchedulerProgress> {
  const { courses, classrooms, timeBlocks, seed, timeoutMs } = config;

  // Initialize seeded random number generator for deterministic results
  const rng = new SeededRandom(seed);

  // Initialize timeout manager to prevent infinite loops
  const timeout = new TimeoutManager(timeoutMs || 60000);

  console.log('\n🚀 SCHEDULER STARTING');
  console.log(`Courses: ${courses.length}, Classrooms: ${classrooms.length}, Time blocks: ${timeBlocks.length}`);
  console.log(`Random seed: ${seed || 'auto (timestamp)'}`);
  console.log(`Timeout: ${timeoutMs || 60000}ms`);
  console.log('Time blocks:', timeBlocks.map(b => `${b.start}-${b.end}`).join(', '));
  console.log('Classrooms:', classrooms.map(c => `${c.name} (${c.type}, cap:${c.capacity})`).join(', '));

  yield {
    stage: 'initializing',
    progress: 0,
    message: 'Scheduler başlatılıyor...',
    totalCourses: courses.length,
  };

  // Process hardcoded schedules
  yield {
    stage: 'hardcoded',
    progress: 10,
    message: 'Sabit programlar işleniyor...',
  };

  const { schedule, processedSessionCount } = processHardcodedSchedules(courses, classrooms);
  const unscheduled: CourseData[] = [];
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  // Initialize O(1) conflict index with hardcoded schedules
  const conflictIndex = new ConflictIndex(courses);
  for (const item of schedule) {
    conflictIndex.addScheduleItem(item);
  }
  console.log('✅ ConflictIndex initialized with', schedule.length, 'hardcoded items');

  yield {
    stage: 'hardcoded',
    progress: 20,
    message: `${schedule.length} sabit program işlendi`,
    scheduledCount: schedule.length,
  };

  // Initialize lecturer load tracking
  const lecturerLoad = new Map<number, number>();
  for (const item of schedule) {
    const course = courseMap.get(item.courseId);
    if (course?.teacherId) {
      const currentLoad = lecturerLoad.get(course.teacherId) || 0;
      lecturerLoad.set(course.teacherId, currentLoad + 1);
    }
  }

  // Sort courses by difficulty
  const sortedCourses = [...courses].sort((a, b) => {
    const aDifficulty = calculateCourseDifficulty(a, classrooms);
    const bDifficulty = calculateCourseDifficulty(b, classrooms);
    
    const diffDiff = bDifficulty - aDifficulty;
    if (Math.abs(diffDiff) > 0.1) {
      return diffDiff > 0 ? 1 : -1;
    }
    
    if (a.teacherId && b.teacherId) {
      const aLoad = lecturerLoad.get(a.teacherId) || 0;
      const bLoad = lecturerLoad.get(b.teacherId) || 0;
      if (aLoad !== bLoad) {
        return aLoad - bLoad;
      }
    }
    
    return 0;
  });

  // Schedule courses
  let processedCourses = 0;
  
  for (const course of sortedCourses) {
    // Check timeout to prevent infinite hangs
    if (timeout.isTimedOut()) {
      console.warn('⏱️ Scheduler timeout reached, returning partial schedule');
      console.warn(`Processed ${processedCourses}/${courses.length} courses in ${timeout.getElapsedMs()}ms`);

      yield {
        stage: 'error',
        progress: 100,
        message: 'Zamanaşımı: Kısmi program döndürülüyor',
        warnings: [`Scheduler reached timeout limit of ${timeoutMs || 60000}ms`],
        scheduledCount: schedule.length,
        totalCourses: courses.length,
      };

      return { schedule, unscheduled: sortedCourses.slice(processedCourses) };
    }

    processedCourses++;

    if (processedCourses % 5 === 0) {
      yield {
        stage: 'scheduling',
        progress: 20 + Math.floor((processedCourses / courses.length) * 60),
        message: `Dersler programlanıyor: ${processedCourses}/${courses.length}`,
        currentCourse: `${course.code} - ${course.name}`,
        scheduledCount: schedule.length,
        totalCourses: courses.length,
        estimatedTimeRemaining: timeout.getRemainingMs(),
      };
    }

    const totalStudents = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
    const mainDepartment = course.departments[0]?.department || '';

    let hardcodedAndScheduledHours = processedSessionCount.get(course.id) || 0;

    const allSessions = [...course.sessions].sort((a, b) => b.hours - a.hours);
    const sessionsToSchedule: { type: string, hours: number }[] = [];

    for (const sess of allSessions) {
      if (hardcodedAndScheduledHours >= sess.hours) {
        hardcodedAndScheduledHours -= sess.hours;
        continue;
      }

      if (hardcodedAndScheduledHours > 0) {
        sessionsToSchedule.push({ type: sess.type, hours: sess.hours - hardcodedAndScheduledHours });
        hardcodedAndScheduledHours = 0;
      } else {
        sessionsToSchedule.push(sess);
      }
    }

    if (sessionsToSchedule.length === 0) continue;

    let courseFullyScheduled = true;
    const scheduledDays = new Set<string>();

    for (const session of sessionsToSchedule) {
      let sessionScheduled = false;
      const duration = session.hours;

      console.log(`\n🔍 Scheduling session: ${course.code} - ${session.type} (${duration}h)`);
      console.log(`   Students: ${totalStudents}, Capacity margin: ${course.capacityMargin}%`);
      console.log(`   Time blocks available: ${timeBlocks.length}`);

      const shuffledDays = rng.shuffle([...DAYS]);

      for (const day of shuffledDays) {
        if (sessionScheduled) break;

        console.log(`\n  Trying day: ${day}`);

        const possibleStartIndices = rng.shuffle(
          Array.from({ length: timeBlocks.length - duration + 1 }, (_, i) => i)
        );

        for (const startIndex of possibleStartIndices) {
          if (sessionScheduled) break;

          const currentBlocks: TimeBlock[] = [];
          const blockRanges: string[] = [];
          let isValidSequence = true;

          for (let i = 0; i < duration; i++) {
            const blockIndex = startIndex + i;
            const currentBlock = timeBlocks[blockIndex];
            const nextBlock = (i < duration - 1) ? timeBlocks[blockIndex + 1] : null;

            if (nextBlock && currentBlock.end !== nextBlock.start) {
              isValidSequence = false;
              break;
            }

            currentBlocks.push(currentBlock);
            blockRanges.push(`${currentBlock.start}-${currentBlock.end}`);

            if (!isTeacherAvailable(course.teacherWorkingHours, day, currentBlock)) {
              console.log(`      ❌ Teacher not available at ${currentBlock.start}-${currentBlock.end} on ${day}`);
              isValidSequence = false;
              break;
            }

            // Use O(1) conflict index instead of O(n) hasConflict
            // Check for teacher and department conflicts (classroom not yet assigned)
            const conflictReason = conflictIndex.checkConflicts(
              course.id,
              -1, // Classroom not yet selected
              day,
              `${currentBlock.start}-${currentBlock.end}`
            );

            // Allow classroom conflicts at this stage (we haven't selected classroom yet)
            if (conflictReason && conflictReason.type !== 'classroom') {
              console.log(`      ❌ Conflict: ${conflictReason.message}`);
              isValidSequence = false;
              break;
            }
          }

          if (!isValidSequence) continue;

          const occupiedClassroomsByBlock: Set<number>[] = [];
          for (const range of blockRanges) {
            const occupied = new Set(
              schedule
                .filter(s => s.day === day && s.timeRange === range)
                .map(s => s.classroomId)
            );
            occupiedClassroomsByBlock.push(occupied);
          }

          console.log(`    Trying time: ${currentBlocks[0].start}-${currentBlocks[duration-1].end}`);

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
            console.log(`    ✅ FOUND classroom: ${classroom.name} (capacity: ${classroom.capacity})`);
          } else {
            console.log(`    ❌ No suitable classroom found`);
          }

          if (classroom) {
            const startBlock = currentBlocks[0];
            const endBlock = currentBlocks[duration - 1];
            const newItem = {
              courseId: course.id,
              classroomId: classroom.id,
              day,
              timeRange: `${startBlock.start}-${endBlock.end}`,
              sessionType: session.type,
              sessionHours: duration,
              isHardcoded: false
            };

            schedule.push(newItem);

            // Add to conflict index for O(1) lookups
            conflictIndex.addScheduleItem(newItem);

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

  yield {
    stage: 'optimizing',
    progress: 85,
    message: 'Program optimize ediliyor...',
    scheduledCount: schedule.length,
  };

  // Local improvement
  performLocalImprovement(schedule, courseMap, classrooms, timeBlocks, rng, 30);

  yield {
    stage: 'complete',
    progress: 100,
    message: 'Programlama tamamlandı!',
    scheduledCount: schedule.length,
  };

  return { schedule, unscheduled };
}

/**
 * Calculate metrics for the generated schedule
 */
export function calculateScheduleMetrics(
  schedule: ScheduleItem[],
  courses: CourseData[],
  classrooms: ClassroomData[]
) {
  const capacityMargins: number[] = [];
  let maxCapacityWaste = 0;
  const teacherLoads = new Map<number, number>();
  
  for (const item of schedule) {
    const course = courses.find(c => c.id === item.courseId);
    const classroom = classrooms.find(c => c.id === item.classroomId);
    
    if (course && classroom) {
      const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
      const adjustedStudentCount = course.capacityMargin > 0
        ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
        : studentCount;
      
      const margin = classroom.capacity - adjustedStudentCount;
      const marginPercent = classroom.capacity > 0 ? (margin / classroom.capacity) * 100 : 0;
      capacityMargins.push(marginPercent);
      
      const wastePercent = classroom.capacity > 0 ? ((classroom.capacity - adjustedStudentCount) / classroom.capacity) * 100 : 0;
      maxCapacityWaste = Math.max(maxCapacityWaste, wastePercent);
      
      if (course.teacherId) {
        const currentLoad = teacherLoads.get(course.teacherId) || 0;
        teacherLoads.set(course.teacherId, currentLoad + item.sessionHours);
      }
    }
  }
  
  const avgCapacityMargin = capacityMargins.length > 0
    ? capacityMargins.reduce((a, b) => a + b, 0) / capacityMargins.length
    : 0;
  
  const teacherLoadValues = Array.from(teacherLoads.values());
  let teacherLoadStddev = 0;
  if (teacherLoadValues.length > 1) {
    const avgLoad = teacherLoadValues.reduce((a, b) => a + b, 0) / teacherLoadValues.length;
    const variance = teacherLoadValues.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / teacherLoadValues.length;
    teacherLoadStddev = Math.sqrt(variance);
  }

  return {
    avg_capacity_margin: Math.round(avgCapacityMargin * 10) / 10,
    max_capacity_waste: Math.round(maxCapacityWaste * 10) / 10,
    teacher_load_stddev: Math.round(teacherLoadStddev * 10) / 10,
  };
}
