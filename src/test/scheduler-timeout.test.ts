import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeoutManager } from '@/lib/scheduler/timeout';

describe('TimeoutManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not be timed out initially', () => {
    const tm = new TimeoutManager(5000, 0);
    expect(tm.isTimedOut()).toBe(false);
  });

  it('should detect timeout after elapsed time', () => {
    const tm = new TimeoutManager(1000, 0);
    vi.advanceTimersByTime(1001);
    expect(tm.isTimedOut()).toBe(true);
  });

  it('should not check before interval', () => {
    const tm = new TimeoutManager(1000, 500);
    vi.advanceTimersByTime(200);
    // Within check interval, should return false even though not timed out
    expect(tm.isTimedOut()).toBe(false);
  });

  it('should return elapsed time', () => {
    const tm = new TimeoutManager(5000);
    vi.advanceTimersByTime(2000);
    expect(tm.getElapsedMs()).toBe(2000);
  });

  it('should return remaining time', () => {
    const tm = new TimeoutManager(5000);
    vi.advanceTimersByTime(2000);
    expect(tm.getRemainingMs()).toBe(3000);
  });

  it('should not return negative remaining time', () => {
    const tm = new TimeoutManager(1000);
    vi.advanceTimersByTime(5000);
    expect(tm.getRemainingMs()).toBe(0);
  });

  it('should calculate time progress', () => {
    const tm = new TimeoutManager(10000);
    vi.advanceTimersByTime(5000);
    expect(tm.getTimeProgress()).toBe(50);
  });

  it('should cap progress at 100', () => {
    const tm = new TimeoutManager(1000);
    vi.advanceTimersByTime(5000);
    expect(tm.getTimeProgress()).toBe(100);
  });

  it('should throw on checkAndThrow when timed out', () => {
    const tm = new TimeoutManager(1000, 0);
    vi.advanceTimersByTime(1001);
    expect(() => tm.checkAndThrow()).toThrow('Scheduler timeout exceeded');
  });

  it('should not throw on checkAndThrow when not timed out', () => {
    const tm = new TimeoutManager(5000, 0);
    expect(() => tm.checkAndThrow()).not.toThrow();
  });

  it('should reset timer', () => {
    const tm = new TimeoutManager(5000, 0);
    vi.advanceTimersByTime(3000);
    tm.reset();
    expect(tm.getElapsedMs()).toBe(0);
    expect(tm.isTimedOut()).toBe(false);
  });
});
