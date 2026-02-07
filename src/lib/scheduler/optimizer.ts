/**
 * Schedule Optimizer
 * Advanced optimization techniques for improving schedule quality
 */

import type { ScheduleItem, CourseData, ClassroomData, TimeBlock } from './types';
import type { SchedulerSettings } from './config';

/**
 * Calculate soft constraint score for a schedule
 * Higher score = better schedule
 */
export function calculateSoftScore(
  schedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classroomMap: Map<number, ClassroomData>,
  config: SchedulerSettings
): number {
  let score = 0;
  const capacityUtilizations: number[] = [];
  const teacherLoads = new Map<number, number>();
  const dayDistribution = new Map<number, Set<string>>(); // courseId -> Set of days

  for (const item of schedule) {
    const course = courseMap.get(item.courseId);
    if (!course) continue;

    const classroom = classroomMap.get(item.classroomId);
    if (!classroom) continue;

    const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
    const adjustedStudentCount = course.capacityMargin > 0
      ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
      : studentCount;

    // 1. Capacity utilization score (0.7-0.9 ideal = +10, <0.4 = -5)
    const utilization = adjustedStudentCount / classroom.capacity;
    capacityUtilizations.push(utilization);

    if (utilization >= config.capacity.idealMinRatio && utilization <= config.capacity.idealMaxRatio) {
      score += 10;
    } else if (utilization < config.capacity.penaltyThreshold) {
      score -= 5;
    }

    // 2. Department priority bonus (+5 if using priority classroom)
    const mainDept = course.departments[0]?.department;
    if (classroom.priorityDept === mainDept) {
      score += 5;
    }

    // 3. Teacher load tracking (for balance calculation)
    if (course.teacherId) {
      const currentLoad = teacherLoads.get(course.teacherId) || 0;
      teacherLoads.set(course.teacherId, currentLoad + item.sessionHours);
    }

    // 4. Day distribution tracking (prefer sessions on different days)
    if (!dayDistribution.has(item.courseId)) {
      dayDistribution.set(item.courseId, new Set());
    }
    dayDistribution.get(item.courseId)!.add(item.day);
  }

  // 5. Teacher load balance score (lower variance = better)
  const teacherLoadValues = Array.from(teacherLoads.values());
  if (teacherLoadValues.length > 1) {
    const avgLoad = teacherLoadValues.reduce((a, b) => a + b, 0) / teacherLoadValues.length;
    const variance = teacherLoadValues.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / teacherLoadValues.length;
    const stddev = Math.sqrt(variance);
    score -= stddev * 0.5; // Penalize high variance
  }

  // 6. Day distribution bonus (prefer spreading sessions across different days)
  for (const days of dayDistribution.values()) {
    if (days.size >= 2) {
      score += 3; // Bonus for good day distribution
    }
  }

  // 7. Capacity waste penalty (heavily penalize very inefficient usage)
  const highWaste = capacityUtilizations.filter(u => u < 0.3).length;
  score -= highWaste * 3;

  return score;
}

/**
 * Hill Climbing Optimizer
 * Attempts to improve schedule by swapping random items
 */
export class HillClimbingOptimizer {
  private config: SchedulerSettings;
  private courseMap: Map<number, CourseData>;
  private classroomMap: Map<number, ClassroomData>;
  private timeBlocks: TimeBlock[];

  constructor(
    courses: CourseData[],
    classrooms: ClassroomData[],
    timeBlocks: TimeBlock[],
    config: SchedulerSettings
  ) {
    this.config = config;
    this.courseMap = new Map(courses.map(c => [c.id, c]));
    this.classroomMap = new Map(classrooms.map(c => [c.id, c]));
    this.timeBlocks = timeBlocks;
  }

  /**
   * Optimize schedule using hill climbing with simulated annealing
   * Returns improved schedule
   */
  optimize(schedule: ScheduleItem[]): ScheduleItem[] {
    const { iterations, acceptanceRate, improvementThreshold } = this.config.hillClimbing;

    let currentSchedule = [...schedule];
    let currentScore = calculateSoftScore(currentSchedule, this.courseMap, this.classroomMap, this.config);
    let bestScore = currentScore;
    let bestSchedule = [...currentSchedule];
    let iterationsWithoutImprovement = 0;

    for (let iter = 0; iter < iterations; iter++) {
      // Early stopping if no improvement
      if (iterationsWithoutImprovement >= improvementThreshold) {
        break;
      }

      // Select two random non-hardcoded items
      const nonHardcodedItems = currentSchedule.filter(s => !s.isHardcoded);
      if (nonHardcodedItems.length < 2) break;

      const idx1 = Math.floor(Math.random() * nonHardcodedItems.length);
      let idx2 = Math.floor(Math.random() * nonHardcodedItems.length);
      while (idx2 === idx1) {
        idx2 = Math.floor(Math.random() * nonHardcodedItems.length);
      }

      const item1 = nonHardcodedItems[idx1];
      const item2 = nonHardcodedItems[idx2];

      // Find original indices
      const origIdx1 = currentSchedule.findIndex(s => s === item1);
      const origIdx2 = currentSchedule.findIndex(s => s === item2);

      // Try swapping their time slots
      const tempSchedule = [...currentSchedule];
      tempSchedule[origIdx1] = { ...item1, day: item2.day, timeRange: item2.timeRange };
      tempSchedule[origIdx2] = { ...item2, day: item1.day, timeRange: item1.timeRange };

      // Calculate new score
      const newScore = calculateSoftScore(tempSchedule, this.courseMap, this.classroomMap, this.config);

      // Accept if better, or with probability if worse (simulated annealing)
      const scoreDiff = newScore - currentScore;
      const shouldAccept = scoreDiff >= 0 || Math.random() < acceptanceRate * Math.exp(scoreDiff / 10);

      if (shouldAccept) {
        currentSchedule = tempSchedule;
        currentScore = newScore;

        // Track best solution
        if (newScore > bestScore) {
          bestScore = newScore;
          bestSchedule = [...tempSchedule];
          iterationsWithoutImprovement = 0;
        } else {
          iterationsWithoutImprovement++;
        }
      } else {
        iterationsWithoutImprovement++;
      }
    }

    return bestSchedule;
  }
}

/**
 * Greedy course selector
 * Determines optimal ordering for course placement
 */
export function sortCoursesByDifficulty(
  courses: CourseData[],
  classrooms: ClassroomData[],
  config: SchedulerSettings,
  lecturerLoad: Map<number, number> = new Map()
): CourseData[] {
  const { studentWeightFactor, classroomScarcityFactor, sessionDurationFactor } = config.difficulty;

  const calculateDifficulty = (course: CourseData): number => {
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

    // Calculate average session duration
    const totalSessionHours = course.sessions.reduce((sum, s) => sum + s.hours, 0);
    const avgSessionDuration = course.sessions.length > 0 ? totalSessionHours / course.sessions.length : 0;

    // Difficulty formula (higher = more difficult = schedule first)
    const difficulty =
      studentCount * studentWeightFactor +
      (availableClassCount > 0 ? 1 / availableClassCount : 100) * classroomScarcityFactor +
      avgSessionDuration * sessionDurationFactor;

    return difficulty;
  };

  // Sort courses by difficulty (higher difficulty first)
  return [...courses].sort((a, b) => {
    const aDifficulty = calculateDifficulty(a);
    const bDifficulty = calculateDifficulty(b);

    // Primary sort: higher difficulty first
    if (Math.abs(bDifficulty - aDifficulty) > 0.1) {
      return bDifficulty - aDifficulty;
    }

    // Secondary sort: balance lecturer load
    if (a.teacherId && b.teacherId) {
      const aLoad = lecturerLoad.get(a.teacherId) || 0;
      const bLoad = lecturerLoad.get(b.teacherId) || 0;
      if (aLoad !== bLoad) {
        return aLoad - bLoad; // Lower load first
      }
    }

    return 0;
  });
}

/**
 * Evaluate placement quality
 * Returns quality score for a potential placement
 */
export function evaluatePlacementQuality(
  course: CourseData,
  classroom: ClassroomData,
  day: string,
  timeRange: string,
  currentSchedule: ScheduleItem[],
  config: SchedulerSettings
): number {
  let score = 0;

  const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
  const adjustedStudentCount = course.capacityMargin > 0
    ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
    : studentCount;

  // 1. Capacity utilization (0.7-0.9 ideal)
  const utilization = adjustedStudentCount / classroom.capacity;
  if (utilization >= config.capacity.idealMinRatio && utilization <= config.capacity.idealMaxRatio) {
    score += 20;
  } else if (utilization >= 0.5 && utilization < config.capacity.idealMinRatio) {
    score += 10;
  } else if (utilization < config.capacity.penaltyThreshold) {
    score -= 10;
  }

  // 2. Department priority
  const mainDept = course.departments[0]?.department;
  if (classroom.priorityDept === mainDept) {
    score += 10;
  }

  // 3. Day distribution (prefer different days for same course)
  const courseDays = new Set(
    currentSchedule
      .filter(s => s.courseId === course.id)
      .map(s => s.day)
  );
  if (!courseDays.has(day)) {
    score += 15; // Bonus for using a new day
  } else {
    score -= 5; // Penalty for reusing same day
  }

  // 4. Time preference (prefer middle of day over early morning or late afternoon)
  const [startTime] = timeRange.split('-');
  const hour = parseInt(startTime.split(':')[0]);
  if (hour >= 10 && hour <= 14) {
    score += 5; // Bonus for mid-day slots
  }

  return score;
}
