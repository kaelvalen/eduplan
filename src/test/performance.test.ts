import { describe, it, expect, vi, afterEach } from 'vitest';
import { PerformanceMarker, trackApiRequest, trackSchedulerPerformance } from '@/lib/performance';

describe('Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('PerformanceMarker', () => {
    it('should measure duration', () => {
      const marker = new PerformanceMarker();
      marker.start('test');
      // performance.now() advances in real time, just check it returns a value
      const duration = marker.end('test');
      expect(duration).toBeTypeOf('number');
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should return null for unknown label', () => {
      const marker = new PerformanceMarker();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const duration = marker.end('unknown');
      expect(duration).toBeNull();
      warnSpy.mockRestore();
    });

    it('should measure and log', () => {
      const marker = new PerformanceMarker();
      vi.spyOn(console, 'log').mockImplementation(() => {});
      marker.start('test-measure');
      const duration = marker.measure('test-measure');
      expect(duration).toBeTypeOf('number');
      // measure() logs a single formatted string
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test-measure'));
    });

    it('should warn for slow operations', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Use non-zero start to avoid falsy check (!0 === true)
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 1000 : 3000; // 2 second duration
      });

      const marker = new PerformanceMarker();
      marker.start('slow-op');
      marker.end('slow-op');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow operation'),
        expect.objectContaining({ operation: 'slow-op' })
      );
    });
  });

  describe('trackApiRequest', () => {
    it('should not log good performance', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      trackApiRequest('/api/test', 100, 200);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should log slow API requests', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      trackApiRequest('/api/test', 600, 200);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('API Request Performance'),
        expect.objectContaining({ endpoint: '/api/test' })
      );
    });
  });

  describe('trackSchedulerPerformance', () => {
    it('should log scheduler performance', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
      trackSchedulerPerformance(5000, 20);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Scheduler Performance'),
        expect.objectContaining({ courseCount: 20 })
      );
    });
  });
});
