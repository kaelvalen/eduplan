/**
 * Scheduler Module
 * Central export for all scheduler functionality
 *
 * This module provides a complete scheduling system with:
 * - O(1) conflict detection (ConflictIndex)
 * - Intelligent backtracking (BacktrackingManager)
 * - Advanced optimization (HillClimbingOptimizer)
 * - Real-time progress reporting (ProgressReporter)
 * - Adaptive configuration (AdaptiveConfig)
 * - Simulated annealing optimization
 * - Parameter learning system
 * - Parallel scheduling
 * - Configurable performance settings
 */

// Core types and utilities
export * from './types';
export * from './time-utils';
export * from './constraints';

// Performance and optimization
export * from './conflict-index';
export * from './config';
export * from './optimizer';
export * from './backtracking';
export * from './progress-reporter';

// Advanced features
export * from './adaptive-config';
export * from './simulated-annealing';
export * from './learning-system';
export * from './parallel-scheduler';

// Main scheduler engine
export * from './engine';

// Re-export main scheduler function for convenience
export { generateSchedule, calculateScheduleMetrics } from './engine';
export { parallelSchedule, quickParallelSchedule } from './parallel-scheduler';
export { getLearningStats, clearLearningData, getLearningDatabase } from './learning-system';
