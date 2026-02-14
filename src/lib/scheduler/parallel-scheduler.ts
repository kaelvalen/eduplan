/**
 * Parallel Scheduler
 * Runs multiple scheduling attempts in parallel with different seeds
 * Returns the best result
 */

import type { SchedulerConfig, ScheduleItem, CourseData } from './types';
import { generateSchedule, calculateScheduleMetrics } from './engine';

/**
 * Parallel scheduling configuration
 */
export interface ParallelConfig {
  parallelAttempts: number;  // Number of parallel attempts
  seedBase?: number;         // Base seed for deterministic results
  selectBestBy: 'success_rate' | 'capacity_usage' | 'teacher_balance' | 'combined';
}

/**
 * Result from a single scheduling attempt
 */
interface SchedulingAttempt {
  seed: number;
  schedule: ScheduleItem[];
  unscheduled: CourseData[];
  successRate: number;
  metrics: {
    avg_capacity_margin: number;
    max_capacity_waste: number;
    teacher_load_stddev: number;
  };
  score: number;
}

/**
 * Calculate combined score for a schedule
 * Higher score = better schedule
 */
function calculateCombinedScore(
  successRate: number,
  metrics: SchedulingAttempt['metrics']
): number {
  // Success rate is most important (0-100 points)
  const successScore = successRate * 100;
  
  // Capacity efficiency (0-20 points)
  // Prefer low waste and good margins
  const capacityScore = Math.max(0, 20 - metrics.max_capacity_waste / 5);
  
  // Teacher balance (0-20 points)
  // Lower standard deviation is better
  const balanceScore = Math.max(0, 20 - metrics.teacher_load_stddev);
  
  return successScore + capacityScore + balanceScore;
}

/**
 * Score a scheduling attempt based on selection criteria
 */
function scoreAttempt(
  attempt: SchedulingAttempt,
  selectBy: ParallelConfig['selectBestBy']
): number {
  switch (selectBy) {
    case 'success_rate':
      return attempt.successRate * 100;
    
    case 'capacity_usage':
      return 100 - attempt.metrics.max_capacity_waste;
    
    case 'teacher_balance':
      return 100 - attempt.metrics.teacher_load_stddev;
    
    case 'combined':
    default:
      return calculateCombinedScore(attempt.successRate, attempt.metrics);
  }
}

/**
 * Run a single scheduling attempt
 */
async function runSingleAttempt(
  config: SchedulerConfig,
  seed: number,
  attemptNumber: number
): Promise<SchedulingAttempt> {
  console.log(`🔄 Parallel attempt ${attemptNumber} starting (seed: ${seed})`);
  
  const configWithSeed = { ...config, seed };
  const generator = generateSchedule(configWithSeed);
  
  let schedule: ScheduleItem[] = [];
  let unscheduled: CourseData[] = [];
  
  // Iterate through all progress updates
  for await (const progress of generator) {
    // We could log progress here if needed
    if (progress.stage === 'complete') {
      // This is actually the yielded final progress, not the return value
      // We need to get the return value
    }
  }
  
  // The generator's return value contains the actual result
  // We need to manually get it
  const result = await generator.next();
  if (result.value) {
    schedule = result.value.schedule || [];
    unscheduled = result.value.unscheduled || [];
  }
  
  const totalCourses = config.courses.length;
  const scheduledCount = schedule.length > 0 ? 
    new Set(schedule.map(s => s.courseId)).size : 0;
  const successRate = totalCourses > 0 ? scheduledCount / totalCourses : 0;
  
  const metrics = calculateScheduleMetrics(schedule, config.courses, config.classrooms);
  
  const attempt: SchedulingAttempt = {
    seed,
    schedule,
    unscheduled,
    successRate,
    metrics,
    score: 0, // Will be calculated later
  };
  
  console.log(`✅ Attempt ${attemptNumber} complete: ${(successRate * 100).toFixed(1)}% success`);
  
  return attempt;
}

/**
 * Run multiple scheduling attempts in parallel
 * Returns the best result based on selection criteria
 */
export async function parallelSchedule(
  config: SchedulerConfig,
  parallelConfig: ParallelConfig = {
    parallelAttempts: 3,
    selectBestBy: 'combined',
  }
): Promise<{
  bestSchedule: ScheduleItem[];
  bestUnscheduled: CourseData[];
  bestSeed: number;
  bestScore: number;
  allAttempts: SchedulingAttempt[];
}> {
  console.log('🚀 Starting Parallel Scheduling');
  console.log(`   Attempts: ${parallelConfig.parallelAttempts}`);
  console.log(`   Selection criteria: ${parallelConfig.selectBestBy}`);
  
  const seedBase = parallelConfig.seedBase || Date.now();
  const attempts: Promise<SchedulingAttempt>[] = [];
  
  // Launch all attempts in parallel
  for (let i = 0; i < parallelConfig.parallelAttempts; i++) {
    const seed = seedBase + i * 1000; // Different seeds for each attempt
    attempts.push(runSingleAttempt(config, seed, i + 1));
  }
  
  // Wait for all attempts to complete
  const results = await Promise.all(attempts);
  
  // Score each attempt
  for (const result of results) {
    result.score = scoreAttempt(result, parallelConfig.selectBestBy);
  }
  
  // Find the best attempt
  const bestAttempt = results.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  console.log('🏆 Parallel Scheduling Complete');
  console.log(`   Best attempt: seed ${bestAttempt.seed}`);
  console.log(`   Success rate: ${(bestAttempt.successRate * 100).toFixed(1)}%`);
  console.log(`   Score: ${bestAttempt.score.toFixed(2)}`);
  console.log(`   Capacity waste: ${bestAttempt.metrics.max_capacity_waste.toFixed(1)}%`);
  console.log(`   Teacher balance: σ=${bestAttempt.metrics.teacher_load_stddev.toFixed(2)}`);
  
  // Log comparison
  console.log('\n📊 All Attempts Comparison:');
  results.forEach((attempt, idx) => {
    console.log(`   #${idx + 1} (seed ${attempt.seed}): ` +
      `${(attempt.successRate * 100).toFixed(1)}% success, ` +
      `score ${attempt.score.toFixed(2)}`);
  });
  
  return {
    bestSchedule: bestAttempt.schedule,
    bestUnscheduled: bestAttempt.unscheduled,
    bestSeed: bestAttempt.seed,
    bestScore: bestAttempt.score,
    allAttempts: results,
  };
}

/**
 * Quick parallel schedule with sensible defaults
 * Runs 3 attempts and picks the best
 */
export async function quickParallelSchedule(
  config: SchedulerConfig
): Promise<ScheduleItem[]> {
  const result = await parallelSchedule(config, {
    parallelAttempts: 3,
    selectBestBy: 'combined',
  });
  
  return result.bestSchedule;
}
