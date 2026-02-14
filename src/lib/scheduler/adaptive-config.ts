/**
 * Adaptive Configuration System
 * Dynamically adjusts scheduler parameters based on problem characteristics
 */

import type { SchedulerSettings } from './config';
import type { CourseData, ClassroomData } from './types';

/**
 * Problem characteristics that influence configuration
 */
export interface ProblemCharacteristics {
  courseCount: number;
  classroomCount: number;
  avgStudentsPerCourse: number;
  totalStudents: number;
  classroomUtilization: number; // 0-1, how scarce classrooms are
  teacherCount: number;
  avgCoursesPerTeacher: number;
  hasLabCourses: boolean;
  avgSessionDuration: number;
}

/**
 * Runtime metrics used for adaptive adjustments
 */
export interface RuntimeMetrics {
  currentScheduledCount: number;
  currentUnscheduledCount: number;
  avgCapacityWaste: number;
  teacherLoadVariance: number;
  classroomScarcity: number; // 0-1, how hard it is to find classrooms
  conflictRate: number; // 0-1, how often we hit conflicts
}

/**
 * Analyze problem characteristics from input data
 */
export function analyzeProblemCharacteristics(
  courses: CourseData[],
  classrooms: ClassroomData[]
): ProblemCharacteristics {
  const totalStudents = courses.reduce((sum, c) => 
    sum + c.departments.reduce((s, d) => s + d.studentCount, 0), 0
  );
  
  const avgStudentsPerCourse = courses.length > 0 ? totalStudents / courses.length : 0;
  
  const teacherIds = new Set(courses.map(c => c.teacherId).filter(id => id !== null));
  const teacherCount = teacherIds.size;
  const avgCoursesPerTeacher = teacherCount > 0 ? courses.length / teacherCount : 0;
  
  const hasLabCourses = courses.some(c => c.sessions.some(s => s.type === 'lab'));
  
  const totalSessionHours = courses.reduce((sum, c) => 
    sum + c.sessions.reduce((s, sess) => s + sess.hours, 0), 0
  );
  const avgSessionDuration = courses.length > 0 ? totalSessionHours / courses.length : 0;
  
  // Calculate classroom utilization (demand vs supply)
  const totalCapacity = classrooms.reduce((sum, c) => c.isActive ? sum + c.capacity : sum, 0);
  const classroomUtilization = totalCapacity > 0 ? totalStudents / totalCapacity : 1;
  
  return {
    courseCount: courses.length,
    classroomCount: classrooms.filter(c => c.isActive).length,
    avgStudentsPerCourse,
    totalStudents,
    classroomUtilization,
    teacherCount,
    avgCoursesPerTeacher,
    hasLabCourses,
    avgSessionDuration,
  };
}

/**
 * Calculate adaptive timeout based on problem size
 */
export function calculateAdaptiveTimeout(chars: ProblemCharacteristics): number {
  const baseTimeout = 30000; // 30 seconds base
  const timePerCourse = 500; // 500ms per course
  const complexityMultiplier = chars.hasLabCourses ? 1.3 : 1.0;
  
  // More time if classrooms are scarce
  const scarcityMultiplier = chars.classroomUtilization > 0.8 ? 1.5 : 1.0;
  
  const timeout = baseTimeout + 
    (chars.courseCount * timePerCourse * complexityMultiplier * scarcityMultiplier);
  
  // Cap at 5 minutes
  return Math.min(timeout, 300000);
}

/**
 * Adjust difficulty weights based on problem characteristics
 */
export function adaptDifficultyWeights(
  chars: ProblemCharacteristics,
  baseConfig: SchedulerSettings
): SchedulerSettings['difficulty'] {
  const weights = { ...baseConfig.difficulty };
  
  // If classrooms are very scarce, increase classroom scarcity weight
  if (chars.classroomUtilization > 0.9) {
    weights.classroomScarcityFactor *= 1.5;
  } else if (chars.classroomUtilization < 0.5) {
    // If classrooms are abundant, reduce weight
    weights.classroomScarcityFactor *= 0.7;
  }
  
  // If average class size is large, increase student weight
  if (chars.avgStudentsPerCourse > 100) {
    weights.studentWeightFactor *= 1.3;
  }
  
  // If sessions are long on average, increase duration weight
  if (chars.avgSessionDuration > 3) {
    weights.sessionDurationFactor *= 1.5;
  }
  
  return weights;
}

/**
 * Adjust capacity constraints based on runtime metrics
 */
export function adaptCapacityConstraints(
  metrics: RuntimeMetrics,
  baseConfig: SchedulerSettings
): SchedulerSettings['capacity'] {
  const capacity = { ...baseConfig.capacity };
  
  // If we're wasting a lot of capacity, tighten the ideal range
  if (metrics.avgCapacityWaste > 40) {
    capacity.idealMinRatio = Math.min(0.8, capacity.idealMinRatio + 0.1);
    capacity.idealMaxRatio = Math.min(0.95, capacity.idealMaxRatio + 0.05);
  }
  
  // If classrooms are scarce, be more lenient with capacity usage
  if (metrics.classroomScarcity > 0.8) {
    capacity.idealMinRatio = Math.max(0.5, capacity.idealMinRatio - 0.2);
    capacity.penaltyThreshold = Math.max(0.3, capacity.penaltyThreshold - 0.1);
  }
  
  return capacity;
}

/**
 * Adjust hill climbing parameters based on runtime metrics
 */
export function adaptHillClimbingParams(
  metrics: RuntimeMetrics,
  baseConfig: SchedulerSettings
): SchedulerSettings['hillClimbing'] {
  const hillClimbing = { ...baseConfig.hillClimbing };
  
  // If teacher load variance is high, increase iterations to balance better
  if (metrics.teacherLoadVariance > 5) {
    hillClimbing.iterations = Math.min(100, hillClimbing.iterations * 1.5);
    hillClimbing.acceptanceRate = Math.min(0.2, hillClimbing.acceptanceRate * 1.2);
  }
  
  // If we have high success rate, we can afford more optimization
  const successRate = metrics.currentScheduledCount / 
    (metrics.currentScheduledCount + metrics.currentUnscheduledCount);
  
  if (successRate > 0.95) {
    hillClimbing.iterations = Math.min(150, hillClimbing.iterations * 2);
  } else if (successRate < 0.7) {
    // If struggling, reduce optimization time to finish faster
    hillClimbing.iterations = Math.max(10, Math.floor(hillClimbing.iterations * 0.5));
  }
  
  return hillClimbing;
}

/**
 * Create adaptive configuration based on problem and runtime characteristics
 */
export function createAdaptiveConfig(
  courses: CourseData[],
  classrooms: ClassroomData[],
  baseConfig: SchedulerSettings,
  runtimeMetrics?: RuntimeMetrics
): SchedulerSettings {
  const chars = analyzeProblemCharacteristics(courses, classrooms);
  
  const adaptiveConfig: SchedulerSettings = {
    ...baseConfig,
    difficulty: adaptDifficultyWeights(chars, baseConfig),
    performance: {
      ...baseConfig.performance,
      timeoutMs: calculateAdaptiveTimeout(chars),
    },
  };
  
  // If we have runtime metrics, apply further adaptations
  if (runtimeMetrics) {
    adaptiveConfig.capacity = adaptCapacityConstraints(runtimeMetrics, baseConfig);
    adaptiveConfig.hillClimbing = adaptHillClimbingParams(runtimeMetrics, baseConfig);
  }
  
  return adaptiveConfig;
}

/**
 * Log adaptive configuration changes
 */
export function logAdaptiveChanges(
  original: SchedulerSettings,
  adapted: SchedulerSettings,
  chars: ProblemCharacteristics
): void {
  console.log('🔧 Adaptive Configuration Applied:');
  console.log(`  Problem: ${chars.courseCount} courses, ${chars.classroomCount} classrooms`);
  console.log(`  Classroom utilization: ${(chars.classroomUtilization * 100).toFixed(1)}%`);
  
  if (original.difficulty.studentWeightFactor !== adapted.difficulty.studentWeightFactor) {
    console.log(`  Student weight: ${original.difficulty.studentWeightFactor} → ${adapted.difficulty.studentWeightFactor.toFixed(2)}`);
  }
  
  if (original.difficulty.classroomScarcityFactor !== adapted.difficulty.classroomScarcityFactor) {
    console.log(`  Classroom scarcity weight: ${original.difficulty.classroomScarcityFactor} → ${adapted.difficulty.classroomScarcityFactor.toFixed(2)}`);
  }
  
  if (original.performance.timeoutMs !== adapted.performance.timeoutMs) {
    console.log(`  Timeout: ${original.performance.timeoutMs}ms → ${adapted.performance.timeoutMs}ms`);
  }
  
  if (original.hillClimbing.iterations !== adapted.hillClimbing.iterations) {
    console.log(`  Hill climbing iterations: ${original.hillClimbing.iterations} → ${adapted.hillClimbing.iterations}`);
  }
}
