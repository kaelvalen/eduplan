import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProgressReporter } from '@/lib/scheduler/progress-reporter';
import { DEFAULT_SCHEDULER_CONFIG } from '@/lib/scheduler/config';

describe('ProgressReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct state', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);
    const progress = reporter.getProgress();
    expect(progress.stage).toBe('initializing');
    expect(progress.totalCourses).toBe(10);
    expect(progress.coursesProcessed).toBe(0);
    expect(progress.scheduledCount).toBe(0);
  });

  it('should set stage', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);
    reporter.setStage('scheduling');
    expect(reporter.getProgress().stage).toBe('scheduling');
  });

  it('should track course processing', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);
    reporter.setStage('scheduling');
    reporter.setCurrentCourse('Math 101');
    expect(reporter.getProgress().currentCourse).toBe('Math 101');
    expect(reporter.getProgress().coursesProcessed).toBe(1);
  });

  it('should track scheduled sessions', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);
    reporter.addScheduledSession(3);
    expect(reporter.getProgress().scheduledCount).toBe(3);
    reporter.addScheduledSession(2);
    expect(reporter.getProgress().scheduledCount).toBe(5);
  });

  it('should add warnings', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);
    reporter.addWarning('Test warning');
    expect(reporter.getProgress().warnings).toContain('Test warning');
  });

  it('should calculate progress percentage', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);

    reporter.setStage('initializing');
    expect(reporter.getProgress().progress).toBe(5);

    reporter.setStage('hardcoded');
    expect(reporter.getProgress().progress).toBe(10);

    reporter.setStage('scheduling');
    reporter.setCurrentCourse('C1');
    reporter.setCurrentCourse('C2');
    const progress = reporter.getProgress().progress;
    expect(progress).toBeGreaterThan(10);
    expect(progress).toBeLessThanOrEqual(90);

    reporter.setStage('complete');
    expect(reporter.getProgress().progress).toBe(100);
  });

  it('should invoke callback', () => {
    const callback = vi.fn();
    const config = { ...DEFAULT_SCHEDULER_CONFIG, performance: { ...DEFAULT_SCHEDULER_CONFIG.performance, progressUpdateIntervalMs: 0 } };
    const reporter = new ProgressReporter(10, 15, config, callback);
    reporter.setStage('scheduling');
    expect(callback).toHaveBeenCalled();
  });

  it('should force report', () => {
    const callback = vi.fn();
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG, callback);
    reporter.forceReport();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({ stage: 'initializing' }));
  });

  it('should complete and report', () => {
    const callback = vi.fn();
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG, callback);
    reporter.complete();
    expect(reporter.getProgress().stage).toBe('complete');
    expect(callback).toHaveBeenCalled();
  });

  it('should handle error', () => {
    const callback = vi.fn();
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG, callback);
    reporter.error('Something failed');
    expect(reporter.getProgress().stage).toBe('error');
    expect(reporter.getProgress().warnings).toContain('Something failed');
  });

  it('should return final stats', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);
    reporter.setStage('scheduling');
    reporter.setCurrentCourse('C1');
    reporter.addScheduledSession(3);
    reporter.complete();

    const stats = reporter.getStats();
    expect(stats.coursesProcessed).toBe(1);
    expect(stats.sessionsScheduled).toBe(3);
    expect(stats.successRate).toBe(20); // 3/15 * 100
    expect(stats.totalDuration).toBeGreaterThanOrEqual(0);
  });

  it('should get current message for each stage', () => {
    const reporter = new ProgressReporter(10, 15, DEFAULT_SCHEDULER_CONFIG);

    reporter.setStage('initializing');
    expect(reporter.getProgress().message).toContain('Başlatılıyor');

    reporter.setStage('scheduling');
    expect(reporter.getProgress().message).toContain('programlanıyor');

    reporter.setStage('optimizing');
    expect(reporter.getProgress().message).toContain('optimize');

    reporter.setStage('complete');
    expect(reporter.getProgress().message).toContain('Tamamlandı');
  });
});
