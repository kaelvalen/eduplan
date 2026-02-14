import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SCHEDULER_CONFIG,
  FAST_SCHEDULER_CONFIG,
  QUALITY_SCHEDULER_CONFIG,
  getDefaultConfig,
  mergeConfig,
  getConfigPreset,
} from '@/lib/scheduler/config';

describe('Scheduler Config', () => {
  describe('DEFAULT_SCHEDULER_CONFIG', () => {
    it('should have all expected sections', () => {
      expect(DEFAULT_SCHEDULER_CONFIG.difficulty).toBeDefined();
      expect(DEFAULT_SCHEDULER_CONFIG.capacity).toBeDefined();
      expect(DEFAULT_SCHEDULER_CONFIG.hillClimbing).toBeDefined();
      expect(DEFAULT_SCHEDULER_CONFIG.performance).toBeDefined();
      expect(DEFAULT_SCHEDULER_CONFIG.features).toBeDefined();
      expect(DEFAULT_SCHEDULER_CONFIG.simulatedAnnealing).toBeDefined();
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_SCHEDULER_CONFIG.performance.timeoutMs).toBe(60000);
      expect(DEFAULT_SCHEDULER_CONFIG.performance.maxPlacementAttempts).toBe(100);
      expect(DEFAULT_SCHEDULER_CONFIG.capacity.idealMinRatio).toBeGreaterThan(0);
      expect(DEFAULT_SCHEDULER_CONFIG.capacity.idealMaxRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('FAST_SCHEDULER_CONFIG', () => {
    it('should have fewer iterations than default', () => {
      expect(FAST_SCHEDULER_CONFIG.hillClimbing.iterations).toBeLessThan(
        DEFAULT_SCHEDULER_CONFIG.hillClimbing.iterations
      );
    });

    it('should have shorter timeout than default', () => {
      expect(FAST_SCHEDULER_CONFIG.performance.timeoutMs).toBeLessThan(
        DEFAULT_SCHEDULER_CONFIG.performance.timeoutMs
      );
    });
  });

  describe('QUALITY_SCHEDULER_CONFIG', () => {
    it('should have more iterations than default', () => {
      expect(QUALITY_SCHEDULER_CONFIG.hillClimbing.iterations).toBeGreaterThan(
        DEFAULT_SCHEDULER_CONFIG.hillClimbing.iterations
      );
    });

    it('should have longer timeout than default', () => {
      expect(QUALITY_SCHEDULER_CONFIG.performance.timeoutMs).toBeGreaterThan(
        DEFAULT_SCHEDULER_CONFIG.performance.timeoutMs
      );
    });
  });

  describe('getDefaultConfig', () => {
    it('should return a deep copy', () => {
      const config = getDefaultConfig();
      config.difficulty.studentWeightFactor = 999;
      expect(DEFAULT_SCHEDULER_CONFIG.difficulty.studentWeightFactor).not.toBe(999);
    });
  });

  describe('mergeConfig', () => {
    it('should merge partial config with defaults', () => {
      const merged = mergeConfig({
        difficulty: { studentWeightFactor: 10 },
      });

      expect(merged.difficulty.studentWeightFactor).toBe(10);
      // Other values should remain default
      expect(merged.capacity.idealMinRatio).toBe(DEFAULT_SCHEDULER_CONFIG.capacity.idealMinRatio);
    });

    it('should merge multiple sections', () => {
      const merged = mergeConfig({
        performance: { timeoutMs: 120000 },
        features: { enableBacktracking: false },
      });

      expect(merged.performance.timeoutMs).toBe(120000);
      expect(merged.features.enableBacktracking).toBe(false);
      // Unmerged sections remain default
      expect(merged.difficulty.studentWeightFactor).toBe(
        DEFAULT_SCHEDULER_CONFIG.difficulty.studentWeightFactor
      );
    });

    it('should return fresh object', () => {
      const merged = mergeConfig({});
      merged.difficulty.studentWeightFactor = 999;
      expect(DEFAULT_SCHEDULER_CONFIG.difficulty.studentWeightFactor).not.toBe(999);
    });
  });

  describe('getConfigPreset', () => {
    it('should return default config', () => {
      const config = getConfigPreset('default');
      expect(config.performance.timeoutMs).toBe(DEFAULT_SCHEDULER_CONFIG.performance.timeoutMs);
    });

    it('should return fast config', () => {
      const config = getConfigPreset('fast');
      expect(config.performance.timeoutMs).toBe(FAST_SCHEDULER_CONFIG.performance.timeoutMs);
    });

    it('should return quality config', () => {
      const config = getConfigPreset('quality');
      expect(config.performance.timeoutMs).toBe(QUALITY_SCHEDULER_CONFIG.performance.timeoutMs);
    });

    it('should return deep copies', () => {
      const config = getConfigPreset('fast');
      config.difficulty.studentWeightFactor = 999;
      expect(FAST_SCHEDULER_CONFIG.difficulty.studentWeightFactor).not.toBe(999);
    });
  });
});
