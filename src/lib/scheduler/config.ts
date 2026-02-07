/**
 * Scheduler Configuration
 *
 * Centralized configuration for all scheduler parameters.
 * All magic numbers and tuning parameters are defined here for easy adjustment.
 */

export interface SchedulerSettings {
  // Difficulty calculation weights
  difficulty: {
    studentWeightFactor: number;        // Weight for student count
    classroomScarcityFactor: number;    // Weight for available classroom scarcity
    sessionDurationFactor: number;      // Weight for session duration
  };

  // Capacity utilization preferences
  capacity: {
    idealMinRatio: number;              // Minimum ideal capacity usage (0.7 = 70%)
    idealMaxRatio: number;              // Maximum ideal capacity usage (0.9 = 90%)
    penaltyThreshold: number;           // Below this usage is heavily penalized (0.4 = 40%)
  };

  // Hill climbing optimization
  hillClimbing: {
    iterations: number;                 // Number of improvement iterations
    acceptanceRate: number;             // Probability of accepting worse solutions
    improvementThreshold: number;       // Stop if no improvement after N iterations
  };

  // Performance tuning
  performance: {
    maxPlacementAttempts: number;       // Max attempts per course before giving up
    timeoutMs: number;                  // Global timeout in milliseconds (0 = no timeout)
    enableCaching: boolean;             // Cache conflict checks and availability
    progressUpdateIntervalMs: number;   // Report progress every N ms
  };

  // Feature flags
  features: {
    enableCombinedTheoryLab: boolean;   // Try to place theory+lab on same day
    enableSessionSplitting: boolean;    // Allow splitting long sessions
    enableBacktracking: boolean;        // Enable backtracking (experimental)
    enableProgressReporting: boolean;   // Report progress during generation
    enableConflictIndex: boolean;       // Use fast O(1) conflict detection
  };
}

/**
 * Default configuration
 * Optimized for balance between speed and quality
 */
export const DEFAULT_SCHEDULER_CONFIG: SchedulerSettings = {
  difficulty: {
    studentWeightFactor: 2,
    classroomScarcityFactor: 5,
    sessionDurationFactor: 1,
  },

  capacity: {
    idealMinRatio: 0.7,
    idealMaxRatio: 0.9,
    penaltyThreshold: 0.4,
  },

  hillClimbing: {
    iterations: 30,
    acceptanceRate: 0.1,
    improvementThreshold: 5,
  },

  performance: {
    maxPlacementAttempts: 100,
    timeoutMs: 60000, // 1 minute
    enableCaching: true,
    progressUpdateIntervalMs: 500, // 0.5 seconds
  },

  features: {
    enableCombinedTheoryLab: true,
    enableSessionSplitting: true,
    enableBacktracking: false, // Not yet implemented
    enableProgressReporting: true,
    enableConflictIndex: true,
  },
};

/**
 * Fast configuration - optimized for speed over quality
 * Use when you need quick results
 */
export const FAST_SCHEDULER_CONFIG: SchedulerSettings = {
  ...DEFAULT_SCHEDULER_CONFIG,
  hillClimbing: {
    iterations: 10,
    acceptanceRate: 0.05,
    improvementThreshold: 3,
  },
  performance: {
    ...DEFAULT_SCHEDULER_CONFIG.performance,
    maxPlacementAttempts: 50,
    timeoutMs: 30000, // 30 seconds
  },
};

/**
 * Quality configuration - optimized for best results
 * Use when you have time and want the best schedule
 */
export const QUALITY_SCHEDULER_CONFIG: SchedulerSettings = {
  ...DEFAULT_SCHEDULER_CONFIG,
  hillClimbing: {
    iterations: 100,
    acceptanceRate: 0.15,
    improvementThreshold: 10,
  },
  performance: {
    ...DEFAULT_SCHEDULER_CONFIG.performance,
    maxPlacementAttempts: 200,
    timeoutMs: 120000, // 2 minutes
  },
};

/**
 * Get a deep copy of the default config
 */
export function getDefaultConfig(): SchedulerSettings {
  return JSON.parse(JSON.stringify(DEFAULT_SCHEDULER_CONFIG));
}

/**
 * Merge custom config with defaults
 * Allows partial configuration override
 */
export function mergeConfig(custom: Partial<SchedulerSettings>): SchedulerSettings {
  const config = getDefaultConfig();

  if (custom.difficulty) {
    Object.assign(config.difficulty, custom.difficulty);
  }
  if (custom.capacity) {
    Object.assign(config.capacity, custom.capacity);
  }
  if (custom.hillClimbing) {
    Object.assign(config.hillClimbing, custom.hillClimbing);
  }
  if (custom.performance) {
    Object.assign(config.performance, custom.performance);
  }
  if (custom.features) {
    Object.assign(config.features, custom.features);
  }

  return config;
}

/**
 * Get config by preset name
 */
export function getConfigPreset(preset: 'default' | 'fast' | 'quality'): SchedulerSettings {
  switch (preset) {
    case 'fast':
      return JSON.parse(JSON.stringify(FAST_SCHEDULER_CONFIG));
    case 'quality':
      return JSON.parse(JSON.stringify(QUALITY_SCHEDULER_CONFIG));
    default:
      return getDefaultConfig();
  }
}
