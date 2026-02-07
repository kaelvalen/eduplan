/**
 * Intelligent Backtracking System
 * Implements backtracking with constraint propagation for better scheduling
 */

import type { ScheduleItem, CourseData, ClassroomData, TimeBlock, PlacementAttempt } from './types';
import type { SchedulerSettings } from './config';
import { ConflictIndex } from './conflict-index';

/**
 * Placement state tracker
 * Tracks placement attempts and enables intelligent backtracking
 */
export class BacktrackingManager {
  private attemptHistory: Map<number, PlacementAttempt[]>;
  private placementStack: ScheduleItem[];
  private courseAttempts: Map<number, number>;
  private config: SchedulerSettings;
  private conflictIndex: ConflictIndex;

  constructor(courses: CourseData[], config: SchedulerSettings) {
    this.attemptHistory = new Map();
    this.placementStack = [];
    this.courseAttempts = new Map();
    this.config = config;
    this.conflictIndex = new ConflictIndex(courses);
  }

  /**
   * Record a placement attempt
   */
  recordAttempt(attempt: PlacementAttempt): void {
    if (!this.attemptHistory.has(attempt.courseId)) {
      this.attemptHistory.set(attempt.courseId, []);
    }
    this.attemptHistory.get(attempt.courseId)!.push(attempt);

    // Track total attempts for this course
    const count = this.courseAttempts.get(attempt.courseId) || 0;
    this.courseAttempts.set(attempt.courseId, count + 1);
  }

  /**
   * Check if we should give up on this course
   */
  shouldGiveUp(courseId: number): boolean {
    const attempts = this.courseAttempts.get(courseId) || 0;
    return attempts >= this.config.performance.maxPlacementAttempts;
  }

  /**
   * Add item to placement stack and index
   */
  pushPlacement(item: ScheduleItem): void {
    this.placementStack.push(item);
    this.conflictIndex.addScheduleItem(item);
  }

  /**
   * Remove last N placements (backtrack)
   */
  backtrack(count: number = 1): ScheduleItem[] {
    const removed: ScheduleItem[] = [];

    for (let i = 0; i < count; i++) {
      const item = this.placementStack.pop();
      if (item) {
        this.conflictIndex.removeScheduleItem(item);
        removed.push(item);
      }
    }

    return removed;
  }

  /**
   * Get current schedule
   */
  getCurrentSchedule(): ScheduleItem[] {
    return [...this.placementStack];
  }

  /**
   * Get conflict index for fast checking
   */
  getConflictIndex(): ConflictIndex {
    return this.conflictIndex;
  }

  /**
   * Get failed attempts for a course
   */
  getFailedAttempts(courseId: number): PlacementAttempt[] {
    return this.attemptHistory.get(courseId)?.filter(a => !a.success) || [];
  }

  /**
   * Analyze why course is failing
   */
  analyzeFailure(courseId: number): {
    totalAttempts: number;
    teacherConflicts: number;
    classroomConflicts: number;
    departmentConflicts: number;
    availabilityIssues: number;
    mostProblematicDay?: string;
    mostProblematicTime?: string;
  } {
    const attempts = this.attemptHistory.get(courseId) || [];
    const failed = attempts.filter(a => !a.success);

    const conflicts = {
      teacher: failed.filter(a => a.reason?.type === 'teacher').length,
      classroom: failed.filter(a => a.reason?.type === 'classroom').length,
      department: failed.filter(a => a.reason?.type === 'department').length,
      availability: failed.filter(a => a.reason?.type === 'availability').length,
    };

    // Find most problematic day/time
    const dayCount = new Map<string, number>();
    const timeCount = new Map<string, number>();

    for (const attempt of failed) {
      dayCount.set(attempt.day, (dayCount.get(attempt.day) || 0) + 1);
      timeCount.set(attempt.timeRange, (timeCount.get(attempt.timeRange) || 0) + 1);
    }

    let mostProblematicDay: string | undefined;
    let maxDayCount = 0;
    for (const [day, count] of dayCount.entries()) {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostProblematicDay = day;
      }
    }

    let mostProblematicTime: string | undefined;
    let maxTimeCount = 0;
    for (const [time, count] of timeCount.entries()) {
      if (count > maxTimeCount) {
        maxTimeCount = count;
        mostProblematicTime = time;
      }
    }

    return {
      totalAttempts: attempts.length,
      teacherConflicts: conflicts.teacher,
      classroomConflicts: conflicts.classroom,
      departmentConflicts: conflicts.department,
      availabilityIssues: conflicts.availability,
      mostProblematicDay,
      mostProblematicTime,
    };
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalPlacements: number;
    totalAttempts: number;
    avgAttemptsPerCourse: number;
    coursesAttempted: number;
  } {
    let totalAttempts = 0;
    for (const count of this.courseAttempts.values()) {
      totalAttempts += count;
    }

    const coursesAttempted = this.courseAttempts.size;
    const avgAttemptsPerCourse = coursesAttempted > 0 ? totalAttempts / coursesAttempted : 0;

    return {
      totalPlacements: this.placementStack.length,
      totalAttempts,
      avgAttemptsPerCourse: Math.round(avgAttemptsPerCourse * 10) / 10,
      coursesAttempted,
    };
  }
}

/**
 * Domain tracker for constraint propagation
 * Tracks available options for each course
 */
export class DomainTracker {
  private availableSlots: Map<number, Set<string>>; // courseId -> Set of "day|timeRange"
  private classroomOptions: Map<number, Set<number>>; // courseId -> Set of classroomIds

  constructor() {
    this.availableSlots = new Map();
    this.classroomOptions = new Map();
  }

  /**
   * Initialize domain for a course
   */
  initializeDomain(
    courseId: number,
    days: string[],
    timeBlocks: TimeBlock[],
    classrooms: ClassroomData[]
  ): void {
    // Create all possible day-time combinations
    const slots = new Set<string>();
    for (const day of days) {
      for (const block of timeBlocks) {
        slots.add(`${day}|${block.start}-${block.end}`);
      }
    }
    this.availableSlots.set(courseId, slots);

    // Store all classrooms as options
    const classroomIds = new Set(classrooms.filter(c => c.isActive).map(c => c.id));
    this.classroomOptions.set(courseId, classroomIds);
  }

  /**
   * Remove a slot option due to conflict
   */
  removeSlotOption(courseId: number, day: string, timeRange: string): void {
    const key = `${day}|${timeRange}`;
    this.availableSlots.get(courseId)?.delete(key);
  }

  /**
   * Remove a classroom option
   */
  removeClassroomOption(courseId: number, classroomId: number): void {
    this.classroomOptions.get(courseId)?.delete(classroomId);
  }

  /**
   * Get available slots for a course
   */
  getAvailableSlots(courseId: number): string[] {
    return Array.from(this.availableSlots.get(courseId) || []);
  }

  /**
   * Get available classrooms for a course
   */
  getAvailableClassrooms(courseId: number): number[] {
    return Array.from(this.classroomOptions.get(courseId) || []);
  }

  /**
   * Check if course has any options left
   */
  hasOptions(courseId: number): boolean {
    const slots = this.availableSlots.get(courseId);
    const classrooms = this.classroomOptions.get(courseId);
    return (slots?.size || 0) > 0 && (classrooms?.size || 0) > 0;
  }

  /**
   * Get domain size (number of possibilities)
   */
  getDomainSize(courseId: number): number {
    const slotCount = this.availableSlots.get(courseId)?.size || 0;
    const classroomCount = this.classroomOptions.get(courseId)?.size || 0;
    return slotCount * classroomCount;
  }
}

/**
 * Smart placement suggester
 * Suggests best placement options based on current state
 */
export class PlacementSuggester {
  private domainTracker: DomainTracker;
  private conflictIndex: ConflictIndex;

  constructor(domainTracker: DomainTracker, conflictIndex: ConflictIndex) {
    this.domainTracker = domainTracker;
    this.conflictIndex = conflictIndex;
  }

  /**
   * Suggest best time slots for a course
   * Returns sorted list of (day, timeRange) suggestions
   */
  suggestTimeSlots(
    courseId: number,
    maxSuggestions: number = 10
  ): Array<{ day: string; timeRange: string; score: number }> {
    const availableSlots = this.domainTracker.getAvailableSlots(courseId);
    const suggestions: Array<{ day: string; timeRange: string; score: number }> = [];

    for (const slot of availableSlots) {
      const [day, timeRange] = slot.split('|');

      // Score this slot based on current conflicts
      const coursesAtTime = this.conflictIndex.getCoursesAtTime(day, timeRange);
      const conflictCount = coursesAtTime.length;

      // Higher score = better (fewer conflicts)
      const score = 100 - conflictCount * 10;

      suggestions.push({ day, timeRange, score });
    }

    // Sort by score (best first) and return top N
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }

  /**
   * Suggest best classrooms for a course and time
   */
  suggestClassrooms(
    courseId: number,
    day: string,
    timeRange: string,
    maxSuggestions: number = 5
  ): Array<{ classroomId: number; score: number }> {
    const availableClassrooms = this.domainTracker.getAvailableClassrooms(courseId);
    const suggestions: Array<{ classroomId: number; score: number }> = [];

    for (const classroomId of availableClassrooms) {
      // Check if classroom is free at this time
      if (this.conflictIndex.hasClassroomConflict(classroomId, day, timeRange)) {
        continue; // Skip occupied classrooms
      }

      // Score based on usage (prefer less-used classrooms for balance)
      const schedule = this.conflictIndex.getClassroomSchedule(classroomId);
      const usageCount = schedule.length;
      const score = 100 - usageCount; // Lower usage = higher score

      suggestions.push({ classroomId, score });
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);
  }
}
