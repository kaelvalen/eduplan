/**
 * ConflictIndex - Fast O(1) conflict detection
 *
 * This class maintains indices of scheduled items for fast conflict checking.
 * Instead of checking every item in the schedule (O(n)), we use hash maps (O(1)).
 *
 * Key improvements over the original hasConflict function:
 * 1. O(1) lookup time instead of O(n) iteration through schedule
 * 2. Detailed conflict reasons with specific information
 * 3. Reusable across multiple placement attempts
 * 4. Clear separation of concern - only handles conflict detection
 * 5. Support for "what-if" analysis without modifying the schedule
 */

import { normalizeDayName } from '@/constants/time';
import type { ScheduleItem, CourseData, ConflictReason } from './types';

export class ConflictIndex {
  // Map: teacherId -> Set of "day|timeRange" strings
  private teacherSchedule: Map<number, Set<string>>;

  // Map: classroomId -> Set of "day|timeRange" strings
  private classroomSchedule: Map<number, Set<string>>;

  // Map: "dept|semester|level|category" -> Set of "day|timeRange" strings
  // Used for compulsory course conflict detection
  private departmentSchedule: Map<string, Set<string>>;

  // Map: "day|timeRange" -> Set of courseIds scheduled at that time
  // Used for fast lookup of all courses at a given time
  private timeSlotCourses: Map<string, Set<number>>;

  // Map: "classroomId|day|timeRange" -> courseId
  // Used for finding which course occupies a specific classroom at a specific time
  private classroomScheduleItems: Map<string, number>;

  // Course cache for quick lookups
  private courseMap: Map<number, CourseData>;

  // Conflict check cache
  private conflictCache: Map<string, ConflictReason | null>;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  constructor(courses: CourseData[]) {
    this.teacherSchedule = new Map();
    this.classroomSchedule = new Map();
    this.departmentSchedule = new Map();
    this.timeSlotCourses = new Map();
    this.classroomScheduleItems = new Map();
    this.courseMap = new Map(courses.map(c => [c.id, c]));
    this.conflictCache = new Map();
  }

  /**
   * Add a schedule item to the index
   * Call this whenever a new item is placed in the schedule
   */
  addScheduleItem(item: ScheduleItem): void {
    const course = this.courseMap.get(item.courseId);
    if (!course) return;

    const timeKey = `${item.day}|${item.timeRange}`;

    // Index by teacher
    if (course.teacherId) {
      if (!this.teacherSchedule.has(course.teacherId)) {
        this.teacherSchedule.set(course.teacherId, new Set());
      }
      this.teacherSchedule.get(course.teacherId)!.add(timeKey);
    }

    // Index by classroom
    if (!this.classroomSchedule.has(item.classroomId)) {
      this.classroomSchedule.set(item.classroomId, new Set());
    }
    this.classroomSchedule.get(item.classroomId)!.add(timeKey);

    // Index by department (for compulsory courses only)
    if (course.category === 'zorunlu') {
      for (const dept of course.departments) {
        const deptKey = `${dept.department}|${course.semester}|${course.level}|zorunlu`;
        if (!this.departmentSchedule.has(deptKey)) {
          this.departmentSchedule.set(deptKey, new Set());
        }
        this.departmentSchedule.get(deptKey)!.add(timeKey);
      }
    }

    // Index by time slot
    if (!this.timeSlotCourses.has(timeKey)) {
      this.timeSlotCourses.set(timeKey, new Set());
    }
    this.timeSlotCourses.get(timeKey)!.add(item.courseId);

    // Index by classroom schedule item
    const classroomTimeKey = `${item.classroomId}|${timeKey}`;
    this.classroomScheduleItems.set(classroomTimeKey, item.courseId);

    // Invalidate cache since schedule changed
    this.conflictCache.clear();
  }

  /**
   * Remove a schedule item from the index
   * Call this when backtracking or removing an item
   */
  removeScheduleItem(item: ScheduleItem): void {
    const course = this.courseMap.get(item.courseId);
    if (!course) return;

    const timeKey = `${item.day}|${item.timeRange}`;

    // Remove from teacher index
    if (course.teacherId) {
      this.teacherSchedule.get(course.teacherId)?.delete(timeKey);
    }

    // Remove from classroom index
    this.classroomSchedule.get(item.classroomId)?.delete(timeKey);

    // Remove from department index
    if (course.category === 'zorunlu') {
      for (const dept of course.departments) {
        const deptKey = `${dept.department}|${course.semester}|${course.level}|zorunlu`;
        this.departmentSchedule.get(deptKey)?.delete(timeKey);
      }
    }

    // Remove from time slot index
    this.timeSlotCourses.get(timeKey)?.delete(item.courseId);

    // Remove from classroom schedule items index
    const classroomTimeKey = `${item.classroomId}|${timeKey}`;
    this.classroomScheduleItems.delete(classroomTimeKey);

    // Invalidate cache since schedule changed
    this.conflictCache.clear();
  }

  /**
   * Check if teacher has a conflict at given time
   * O(1) lookup instead of O(n) iteration
   */
  hasTeacherConflict(teacherId: number | null, day: string, timeRange: string): boolean {
    if (!teacherId) return false;
    const timeKey = `${day}|${timeRange}`;
    return this.teacherSchedule.get(teacherId)?.has(timeKey) ?? false;
  }

  /**
   * Check if classroom has a conflict at given time
   * O(1) lookup instead of O(n) iteration
   */
  hasClassroomConflict(classroomId: number, day: string, timeRange: string): boolean {
    const timeKey = `${day}|${timeRange}`;
    return this.classroomSchedule.get(classroomId)?.has(timeKey) ?? false;
  }

  /**
   * Check if course has department conflicts at given time
   * O(1) lookup for compulsory courses
   */
  hasDepartmentConflict(course: CourseData, day: string, timeRange: string): boolean {
    if (course.category !== 'zorunlu') return false;

    const timeKey = `${day}|${timeRange}`;

    for (const dept of course.departments) {
      const deptKey = `${dept.department}|${course.semester}|${course.level}|zorunlu`;
      if (this.departmentSchedule.get(deptKey)?.has(timeKey)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check for any conflicts with comprehensive reasons
   * Returns null if no conflict, otherwise returns the conflict reason
   *
   * This is the main function to use for conflict checking.
   * It provides detailed information about why a placement would fail.
   */
  checkConflicts(
    courseId: number,
    classroomId: number,
    day: string,
    timeRange: string
  ): ConflictReason | null {
    // Normalize day name to handle Turkish/English variations
    const normalizedDay = normalizeDayName(day);

    // Check cache first
    const cacheKey = this.getCacheKey(courseId, classroomId, normalizedDay, timeRange);

    if (this.conflictCache.has(cacheKey)) {
      this.cacheHits++;
      return this.conflictCache.get(cacheKey)!;
    }

    this.cacheMisses++;

    const course = this.courseMap.get(courseId);
    if (!course) {
      const result = {
        type: 'department' as const,
        message: 'Course not found in index',
      };
      this.conflictCache.set(cacheKey, result);
      return result;
    }

    // Check teacher conflict
    if (course.teacherId && this.hasTeacherConflict(course.teacherId, normalizedDay, timeRange)) {
      const timeKey = `${normalizedDay}|${timeRange}`;
      const conflictingCourses = Array.from(this.timeSlotCourses.get(timeKey) ?? [])
        .filter(id => {
          const c = this.courseMap.get(id);
          return c?.teacherId === course.teacherId;
        })
        .map(id => {
          const c = this.courseMap.get(id);
          return { id, code: c?.code || 'Unknown', name: c?.name || 'Unknown Course' };
        });

      const result = {
        type: 'teacher' as const,
        message: `Öğretim elemanı çakışması: Bu öğretim elemanı ${normalizedDay} günü ${timeRange} saatinde başka bir derste`,
        details: {
          teacherId: course.teacherId,
          conflictingCourses,
          day: normalizedDay,
          timeRange,
        },
      };
      this.conflictCache.set(cacheKey, result);
      return result;
    }

    // Check classroom conflict
    if (this.hasClassroomConflict(classroomId, normalizedDay, timeRange)) {
      const timeKey = `${normalizedDay}|${timeRange}`;
      const classroomTimeKey = `${classroomId}|${timeKey}`;

      // Find the specific course using this classroom at this time
      const conflictingCourseId = this.classroomScheduleItems.get(classroomTimeKey);
      const conflictingCourses = conflictingCourseId
        ? [conflictingCourseId].map(id => {
            const c = this.courseMap.get(id);
            return { id, code: c?.code || 'Unknown', name: c?.name || 'Unknown Course' };
          })
        : [];

      const result = {
        type: 'classroom' as const,
        message: `Derslik çakışması: ${classroomId} numaralı derslik ${normalizedDay} günü ${timeRange} saatinde dolu`,
        details: {
          classroomId,
          conflictingCourses,
          day: normalizedDay,
          timeRange,
        },
      };
      this.conflictCache.set(cacheKey, result);
      return result;
    }

    // Check department conflict (compulsory courses)
    if (this.hasDepartmentConflict(course, normalizedDay, timeRange)) {
      const timeKey = `${normalizedDay}|${timeRange}`;
      const conflictingCourses = Array.from(this.timeSlotCourses.get(timeKey) ?? [])
        .filter(id => {
          const c = this.courseMap.get(id);
          if (!c || c.category !== 'zorunlu') return false;
          if (c.semester !== course.semester || c.level !== course.level) return false;

          // Check if they share departments
          const courseDepts = course.departments.map(d => d.department);
          const cDepts = c.departments.map(d => d.department);
          return courseDepts.some(d => cDepts.includes(d));
        })
        .map(id => {
          const c = this.courseMap.get(id);
          return { id, code: c?.code || 'Unknown', name: c?.name || 'Unknown Course' };
        });

      const deptNames = course.departments.map(d => d.department).join(', ');
      const result = {
        type: 'department' as const,
        message: `Zorunlu ders çakışması: ${deptNames} bölümü ${course.level}. sınıf ${course.semester} döneminde ${normalizedDay} günü ${timeRange} saatinde başka zorunlu ders var`,
        details: {
          conflictingDepartments: course.departments.map(d => d.department),
          conflictingCourses,
          day: normalizedDay,
          timeRange,
        },
      };
      this.conflictCache.set(cacheKey, result);
      return result;
    }

    // No conflict found - cache the result
    this.conflictCache.set(cacheKey, null);
    return null;
  }

  /**
   * Get all courses scheduled at a given time
   * Useful for debugging and visualization
   */
  getCoursesAtTime(day: string, timeRange: string): number[] {
    const timeKey = `${day}|${timeRange}`;
    return Array.from(this.timeSlotCourses.get(timeKey) ?? []);
  }

  /**
   * Get teacher's full schedule
   * Returns array of "day|timeRange" strings
   */
  getTeacherSchedule(teacherId: number): string[] {
    return Array.from(this.teacherSchedule.get(teacherId) ?? []);
  }

  /**
   * Get classroom's full schedule
   * Returns array of "day|timeRange" strings
   */
  getClassroomSchedule(classroomId: number): string[] {
    return Array.from(this.classroomSchedule.get(classroomId) ?? []);
  }

  /**
   * Clear all indices
   * Call this to reset the index
   */
  clear(): void {
    this.teacherSchedule.clear();
    this.classroomSchedule.clear();
    this.departmentSchedule.clear();
    this.timeSlotCourses.clear();
  }

  /**
   * Get statistics about the index
   * Useful for monitoring and debugging
   */
  getStats(): {
    teachersScheduled: number;
    classroomsUsed: number;
    departmentConfigurations: number;
    uniqueTimeSlots: number;
    totalScheduledItems: number;
  } {
    let totalItems = 0;
    for (const slots of this.timeSlotCourses.values()) {
      totalItems += slots.size;
    }

    return {
      teachersScheduled: this.teacherSchedule.size,
      classroomsUsed: this.classroomSchedule.size,
      departmentConfigurations: this.departmentSchedule.size,
      uniqueTimeSlots: this.timeSlotCourses.size,
      totalScheduledItems: totalItems,
    };
  }

  /**
   * Clear conflict check cache
   * Call this when schedule is modified
   */
  clearCache(): void {
    this.conflictCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.cacheHits + this.cacheMisses;
    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
      size: this.conflictCache.size,
    };
  }

  /**
   * Create cache key for conflict checking
   */
  private getCacheKey(courseId: number, classroomId: number, day: string, timeRange: string): string {
    return `${courseId}|${classroomId}|${day}|${timeRange}`;
  }
}
