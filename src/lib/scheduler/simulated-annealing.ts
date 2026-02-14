/**
 * Simulated Annealing Optimizer
 * Accepts worse solutions with decreasing probability to escape local optima
 */

import type { ScheduleItem, CourseData, ClassroomData } from './types';
import { hasConflict } from './constraints';

/**
 * Simulated Annealing configuration
 */
export interface AnnealingConfig {
  initialTemperature: number;  // Starting temperature (e.g., 100)
  coolingRate: number;          // How fast to cool (e.g., 0.95)
  minTemperature: number;       // Stop when temperature reaches this (e.g., 0.1)
  maxIterations: number;        // Maximum iterations per temperature
}

/**
 * Default annealing configuration
 */
export const DEFAULT_ANNEALING_CONFIG: AnnealingConfig = {
  initialTemperature: 100,
  coolingRate: 0.95,
  minTemperature: 0.1,
  maxIterations: 50,
};

/**
 * Calculate energy (cost) of a schedule
 * Lower energy = better schedule
 */
function calculateEnergy(
  schedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classrooms: ClassroomData[]
): number {
  let energy = 0;
  const teacherLoads = new Map<number, number>();
  
  for (const item of schedule) {
    const course = courseMap.get(item.courseId);
    if (!course) continue;
    
    const classroom = classrooms.find(c => c.id === item.classroomId);
    if (!classroom) continue;
    
    const studentCount = course.departments.reduce((sum, d) => sum + d.studentCount, 0);
    const adjustedStudentCount = course.capacityMargin > 0
      ? Math.ceil(studentCount * (1 - course.capacityMargin / 100))
      : studentCount;
    
    // Capacity utilization penalty
    const utilization = adjustedStudentCount / classroom.capacity;
    
    if (utilization >= 0.7 && utilization <= 0.9) {
      energy -= 10; // Reward good utilization
    } else if (utilization < 0.4) {
      energy += 15; // Penalize waste
    } else if (utilization > 1.0) {
      energy += 50; // Heavy penalty for overcapacity
    }
    
    // Track teacher loads
    if (course.teacherId) {
      const currentLoad = teacherLoads.get(course.teacherId) || 0;
      teacherLoads.set(course.teacherId, currentLoad + item.sessionHours);
    }
  }
  
  // Penalize unbalanced teacher loads
  const teacherLoadValues = Array.from(teacherLoads.values());
  if (teacherLoadValues.length > 1) {
    const avgLoad = teacherLoadValues.reduce((a, b) => a + b, 0) / teacherLoadValues.length;
    const variance = teacherLoadValues.reduce((sum, load) => 
      sum + Math.pow(load - avgLoad, 2), 0
    ) / teacherLoadValues.length;
    energy += Math.sqrt(variance) * 2;
  }
  
  return energy;
}

/**
 * Generate a neighbor solution by swapping two random schedule items
 */
function generateNeighbor(
  schedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  rng: () => number
): ScheduleItem[] | null {
  const nonHardcoded = schedule.filter(s => !s.isHardcoded);
  if (nonHardcoded.length < 2) return null;
  
  const idx1 = Math.floor(rng() * nonHardcoded.length);
  let idx2 = Math.floor(rng() * nonHardcoded.length);
  while (idx2 === idx1) {
    idx2 = Math.floor(rng() * nonHardcoded.length);
  }
  
  const item1 = nonHardcoded[idx1];
  const item2 = nonHardcoded[idx2];
  
  const origIdx1 = schedule.findIndex(s => s === item1);
  const origIdx2 = schedule.findIndex(s => s === item2);
  
  // Create neighbor by swapping day and time
  const neighbor = [...schedule];
  neighbor[origIdx1] = { ...item1, day: item2.day, timeRange: item2.timeRange };
  neighbor[origIdx2] = { ...item2, day: item1.day, timeRange: item1.timeRange };
  
  // Validate the swap doesn't create conflicts
  const course1 = courseMap.get(item1.courseId);
  const course2 = courseMap.get(item2.courseId);
  if (!course1 || !course2) return null;
  
  const conflict1 = hasConflict(
    neighbor.filter((_, i) => i !== origIdx1),
    { 
      courseId: item1.courseId, 
      day: item2.day, 
      timeRange: item2.timeRange, 
      sessionType: item1.sessionType, 
      sessionHours: item1.sessionHours 
    },
    courseMap
  );
  
  const conflict2 = hasConflict(
    neighbor.filter((_, i) => i !== origIdx2),
    { 
      courseId: item2.courseId, 
      day: item1.day, 
      timeRange: item1.timeRange, 
      sessionType: item2.sessionType, 
      sessionHours: item2.sessionHours 
    },
    courseMap
  );
  
  if (conflict1 || conflict2) return null;
  
  return neighbor;
}

/**
 * Acceptance probability for worse solutions
 * Higher temperature = more likely to accept worse solutions
 */
function acceptanceProbability(
  currentEnergy: number,
  neighborEnergy: number,
  temperature: number
): number {
  if (neighborEnergy < currentEnergy) {
    return 1.0; // Always accept better solutions
  }
  
  const delta = neighborEnergy - currentEnergy;
  return Math.exp(-delta / temperature);
}

/**
 * Perform simulated annealing optimization
 * Returns optimized schedule
 */
export function simulatedAnnealing(
  initialSchedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classrooms: ClassroomData[],
  rng: () => number,
  config: AnnealingConfig = DEFAULT_ANNEALING_CONFIG
): ScheduleItem[] {
  let currentSchedule = [...initialSchedule];
  let currentEnergy = calculateEnergy(currentSchedule, courseMap, classrooms);
  
  let bestSchedule = [...currentSchedule];
  let bestEnergy = currentEnergy;
  
  let temperature = config.initialTemperature;
  let totalIterations = 0;
  let acceptedMoves = 0;
  let improvementMoves = 0;
  
  console.log('🔥 Starting Simulated Annealing');
  console.log(`   Initial energy: ${currentEnergy.toFixed(2)}`);
  
  while (temperature > config.minTemperature) {
    for (let i = 0; i < config.maxIterations; i++) {
      totalIterations++;
      
      // Generate neighbor solution
      const neighbor = generateNeighbor(currentSchedule, courseMap, rng);
      if (!neighbor) continue;
      
      const neighborEnergy = calculateEnergy(neighbor, courseMap, classrooms);
      
      // Decide whether to accept the neighbor
      const acceptProb = acceptanceProbability(currentEnergy, neighborEnergy, temperature);
      
      if (rng() < acceptProb) {
        currentSchedule = neighbor;
        currentEnergy = neighborEnergy;
        acceptedMoves++;
        
        // Track best solution found
        if (currentEnergy < bestEnergy) {
          bestSchedule = [...currentSchedule];
          bestEnergy = currentEnergy;
          improvementMoves++;
        }
      }
    }
    
    // Cool down
    temperature *= config.coolingRate;
  }
  
  console.log('🔥 Simulated Annealing Complete');
  console.log(`   Final energy: ${bestEnergy.toFixed(2)} (improved by ${(currentEnergy - bestEnergy).toFixed(2)})`);
  console.log(`   Total iterations: ${totalIterations}`);
  console.log(`   Accepted moves: ${acceptedMoves} (${(acceptedMoves/totalIterations*100).toFixed(1)}%)`);
  console.log(`   Improvements: ${improvementMoves}`);
  
  return bestSchedule;
}

/**
 * Hybrid optimization: Hill climbing followed by simulated annealing
 * Combines fast local search with ability to escape local optima
 */
export function hybridOptimization(
  schedule: ScheduleItem[],
  courseMap: Map<number, CourseData>,
  classrooms: ClassroomData[],
  rng: () => number,
  annealingConfig?: AnnealingConfig
): ScheduleItem[] {
  console.log('🔀 Starting Hybrid Optimization (Hill Climbing + Simulated Annealing)');
  
  // First, do hill climbing for quick improvements
  const afterHillClimbing = [...schedule];
  // Note: Hill climbing is already done in engine.ts, so we skip it here
  
  // Then, apply simulated annealing to escape local optima
  const optimized = simulatedAnnealing(
    afterHillClimbing,
    courseMap,
    classrooms,
    rng,
    annealingConfig
  );
  
  return optimized;
}
