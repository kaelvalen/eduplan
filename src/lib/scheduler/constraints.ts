/**
 * Constraint Checking for Scheduler
 * Handles teacher availability, classroom availability, and conflict detection
 */

import { DAY_MAPPING, normalizeDayName } from '@/constants/time';
import type { TimeBlock, ScheduleItem, CourseData, ClassroomData } from './types';

function timeRangesOverlap(a: string, b: string): boolean {
  const [aStart, aEnd] = a.split('-').map((s) => s.trim());
  const [bStart, bEnd] = b.split('-').map((s) => s.trim());
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
}

function slotMatchesBlock(slot: string, timeBlock: { start: string; end: string }): boolean {
  const s = String(slot).trim();
  const blockRange = `${timeBlock.start}-${timeBlock.end}`;
  if (/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(s)) return timeRangesOverlap(blockRange, s);
  if (/^\d{2}:\d{2}$/.test(s)) return s === timeBlock.start;
  return false;
}

/**
 * Check if teacher is available at given time
 */
export function isTeacherAvailable(
  workingHours: Record<string, string[]>,
  day: string,
  timeBlock: TimeBlock
): boolean {
  // If no configuration is set, assume fully available
  if (!workingHours || Object.keys(workingHours).length === 0) return true;
  // If no day has any non-empty slots (e.g. {"Pazartesi":[], ...}), treat as fully available
  const hasAnySlots = Object.values(workingHours).some((s) => Array.isArray(s) && s.length > 0);
  if (!hasAnySlots) return true;

  // Normalize day name to handle Turkish/English variations
  const normalizedDay = normalizeDayName(day);

  let slots = workingHours[normalizedDay];

  // Try mapped key if direct access fails
  if (!slots) {
    const mappedDay = DAY_MAPPING[normalizedDay];
    if (mappedDay) {
      slots = workingHours[mappedDay];
    }
  }

  // If configuration exists but this day has no slots, assume UNAVAILABLE
  if (!slots || slots.length === 0) return false;

  return slots.some((s) => slotMatchesBlock(s, timeBlock));
}

/**
 * Check if classroom is available at given time
 */
export function isClassroomAvailable(
  availableHours: Record<string, string[]>,
  day: string,
  timeBlock: TimeBlock
): boolean {
  // If no configuration is set, assume fully available
  if (!availableHours || Object.keys(availableHours).length === 0) return true;
  // If no day has any non-empty slots, treat as fully available
  const hasAnySlots = Object.values(availableHours).some((s) => Array.isArray(s) && s.length > 0);
  if (!hasAnySlots) return true;

  // Normalize day name to handle Turkish/English variations
  const normalizedDay = normalizeDayName(day);

  let slots = availableHours[normalizedDay];

  // Try mapped key if direct access fails
  if (!slots) {
    const mappedDay = DAY_MAPPING[normalizedDay];
    if (mappedDay) {
      slots = availableHours[mappedDay];
    }
  }

  // If configuration exists but this day has no slots, assume UNAVAILABLE
  if (!slots || slots.length === 0) return false;

  return slots.some((s) => slotMatchesBlock(s, timeBlock));
}

/**
 * Cache for classroom selection results
 * Speeds up repeated queries with same parameters
 */
class ClassroomSelectionCache {
  private cache: Map<string, ClassroomData | null>;
  private hits: number = 0;
  private misses: number = 0;

  constructor() {
    this.cache = new Map();
  }

  private createKey(
    sessionType: string,
    studentCount: number,
    day: string,
    timeBlocksHash: string,
    occupiedHash: string
  ): string {
    return `${sessionType}|${studentCount}|${day}|${timeBlocksHash}|${occupiedHash}`;
  }

  get(
    sessionType: string,
    studentCount: number,
    day: string,
    timeBlocks: TimeBlock[],
    occupiedClassroomsByBlock: Set<number>[]
  ): ClassroomData | null | undefined {
    const timeBlocksHash = timeBlocks.map(b => `${b.start}-${b.end}`).join(',');
    const occupiedHash = occupiedClassroomsByBlock.map(s => Array.from(s).sort().join('-')).join('|');
    const key = this.createKey(sessionType, studentCount, day, timeBlocksHash, occupiedHash);

    if (this.cache.has(key)) {
      this.hits++;
      return this.cache.get(key);
    }

    this.misses++;
    return undefined;
  }

  set(
    sessionType: string,
    studentCount: number,
    day: string,
    timeBlocks: TimeBlock[],
    occupiedClassroomsByBlock: Set<number>[],
    result: ClassroomData | null
  ): void {
    const timeBlocksHash = timeBlocks.map(b => `${b.start}-${b.end}`).join(',');
    const occupiedHash = occupiedClassroomsByBlock.map(s => Array.from(s).sort().join('-')).join('|');
    const key = this.createKey(sessionType, studentCount, day, timeBlocksHash, occupiedHash);
    this.cache.set(key, result);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      size: this.cache.size,
    };
  }
}

// Global cache instance (reset per schedule generation)
let classroomCache = new ClassroomSelectionCache();

export function resetClassroomCache(): void {
  classroomCache = new ClassroomSelectionCache();
}

export function getClassroomCacheStats() {
  return classroomCache.getStats();
}

/**
 * Find suitable classroom for multiple consecutive time blocks
 * Returns the best classroom based on capacity utilization and preferences
 */
export function findSuitableClassroomForBlocks(
  classrooms: ClassroomData[],
  sessionType: string,
  studentCount: number,
  occupiedClassroomsByBlock: Set<number>[],
  courseCapacityMargin: number,
  courseDepartment: string,
  day: string,
  timeBlocks: TimeBlock[]
): ClassroomData | null {
  // Calculate adjusted capacity with per-course margin
  const adjustedStudentCount = courseCapacityMargin > 0
    ? Math.ceil(studentCount * (1 - courseCapacityMargin / 100))
    : studentCount;

  // Check cache first
  const cached = classroomCache.get(sessionType, adjustedStudentCount, day, timeBlocks, occupiedClassroomsByBlock);
  if (cached !== undefined) {
    // Verify cached classroom is still available and valid
    if (cached === null) return null;

    const stillValid = timeBlocks.every((block, idx) =>
      !occupiedClassroomsByBlock[idx].has(cached.id) &&
      isClassroomAvailable(cached.availableHours, day, block)
    );

    if (stillValid) {
      return cached;
    }
    // Cache invalidated, continue to search
  }

  const suitable = classrooms.filter((c) => {
    // Hard constraint: Check if classroom is active
    if (!c.isActive) return false;

    // Hard constraint: Check capacity
    if (c.capacity < adjustedStudentCount) return false;

    // Check classroom type matching
    // Hibrit classrooms can handle both teorik and lab sessions
    if (sessionType === 'lab') {
      // Lab sessions can use 'lab' or 'hibrit' classrooms
      if (c.type !== 'lab' && c.type !== 'hibrit') return false;
    }
    if (sessionType === 'teorik') {
      // Teorik sessions cannot use pure 'lab' classrooms (but hibrit is OK)
      if (c.type === 'lab') return false;
    }

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

  // Sort by capacity utilization and preferences
  suitable.sort((a, b) => {
    const aRatio = adjustedStudentCount / a.capacity;
    const bRatio = adjustedStudentCount / b.capacity;
    
    const IDEAL_MIN = 0.7;
    const IDEAL_MAX = 0.9;
    const PENALTY_THRESHOLD = 0.4;
    
    const scoreRatio = (ratio: number): number => {
      if (ratio >= IDEAL_MIN && ratio <= IDEAL_MAX) {
        return 100 - Math.abs(ratio - 0.8) * 100;
      } else if (ratio < PENALTY_THRESHOLD) {
        return ratio * 50;
      } else if (ratio > 1.0) {
        return -1000;
      } else {
        if (ratio < IDEAL_MIN) {
          return 50 + (ratio - PENALTY_THRESHOLD) / (IDEAL_MIN - PENALTY_THRESHOLD) * 40;
        } else {
          return 100 - (ratio - IDEAL_MAX) / (1.0 - IDEAL_MAX) * 30;
        }
      }
    };
    
    const aScore = scoreRatio(aRatio);
    const bScore = scoreRatio(bRatio);
    
    if (Math.abs(aScore - bScore) > 1) {
      return bScore - aScore;
    }
    
    // Department/faculty preference
    const aHasPriority = a.priorityDept === courseDepartment;
    const bHasPriority = b.priorityDept === courseDepartment;

    if (aHasPriority && !bHasPriority) return -1;
    if (bHasPriority && !aHasPriority) return 1;

    return a.capacity - b.capacity;
  });

  const result = suitable[0] || null;

  // Cache the result for future lookups
  classroomCache.set(sessionType, adjustedStudentCount, day, timeBlocks, occupiedClassroomsByBlock, result);

  return result;
}

/**
 * Check for scheduling conflicts
 * Validates against teacher conflicts and compulsory course conflicts
 */
export function hasConflict(
  schedule: ScheduleItem[],
  newItem: Omit<ScheduleItem, 'classroomId' | 'isHardcoded'>,
  courses: Map<number, CourseData>
): boolean {
  const course = courses.get(newItem.courseId);
  if (!course) return true;

  for (const item of schedule) {
    if (item.day !== newItem.day) continue;
    if (!timeRangesOverlap(item.timeRange, newItem.timeRange)) continue;

    const existingCourse = courses.get(item.courseId);
    if (!existingCourse) continue;

    // Hard constraint: Same teacher conflict
    if (course.teacherId && course.teacherId === existingCourse.teacherId) {
      return true;
    }

    const courseDepts = course.departments.map((d) => d.department);
    const existingDepts = existingCourse.departments.map((d) => d.department);
    const commonDepts = courseDepts.filter((d) => existingDepts.includes(d));

    if (commonDepts.length === 0) continue;

    // Hard constraint: Compulsory courses cannot conflict
    if (
      course.category === 'zorunlu' &&
      existingCourse.category === 'zorunlu' &&
      course.semester === existingCourse.semester &&
      course.level === existingCourse.level
    ) {
      return true;
    }

    // Hard constraint: Same department and level conflict (for zorunlu only)
    if (course.level === existingCourse.level && course.category === 'zorunlu') {
      return true;
    }
  }

  return false;
}

/**
 * Calculate difficulty score for course scheduling
 * Higher difficulty = schedule earlier (more constrained)
 */
export function calculateCourseDifficulty(
  course: CourseData,
  classrooms: ClassroomData[]
): number {
  const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
  
  // Count available classrooms for this course's session types
  const sessionTypes = new Set(course.sessions.map(s => s.type));
  let availableClassCount = 0;
  
  for (const classroom of classrooms) {
    if (!classroom.isActive) continue;
    
    const canHandle = Array.from(sessionTypes).some(type => {
      if (type === 'lab' && (classroom.type === 'lab' || classroom.type === 'hibrit')) return true;
      if (type === 'teorik' && classroom.type !== 'lab') return true;
      if (type === 'tümü') return true;
      return false;
    });
    
    const adjustedStudentCount = course.capacityMargin > 0
      ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
      : studentCount;
      
    if (canHandle && classroom.capacity >= adjustedStudentCount) {
      availableClassCount++;
    }
  }
  
  const totalSessionHours = course.sessions.reduce((sum, s) => sum + s.hours, 0);
  const avgSessionDuration = course.sessions.length > 0 ? totalSessionHours / course.sessions.length : 0;
  
  // Difficulty formula
  const difficulty = 
    studentCount * 2 +
    (availableClassCount > 0 ? 1 / availableClassCount : 100) * 5 +
    avgSessionDuration;
  
  return difficulty;
}
