import { describe, it, expect } from 'vitest';
import {
  timeToMinutes,
  minutesToTime,
  generateDynamicTimeBlocks,
  calculateDuration,
  timeRangesOverlap,
  areBlocksConsecutive,
} from '@/lib/scheduler/time-utils';

describe('Scheduler Time Utils', () => {
  describe('timeToMinutes', () => {
    it('should convert time to minutes', () => {
      expect(timeToMinutes('09:00')).toBe(540);
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('12:30')).toBe(750);
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('minutesToTime', () => {
    it('should convert minutes to time string', () => {
      expect(minutesToTime(540)).toBe('09:00');
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(750)).toBe('12:30');
      expect(minutesToTime(1439)).toBe('23:59');
    });

    it('should pad with zeros', () => {
      expect(minutesToTime(60)).toBe('01:00');
      expect(minutesToTime(5)).toBe('00:05');
    });
  });

  describe('generateDynamicTimeBlocks', () => {
    it('should generate time blocks skipping lunch', () => {
      const blocks = generateDynamicTimeBlocks({
        slotDuration: 60,
        dayStart: '09:00',
        dayEnd: '17:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
      });

      expect(blocks.length).toBe(7); // 09-10, 10-11, 11-12, 13-14, 14-15, 15-16, 16-17
      expect(blocks[0]).toEqual({ start: '09:00', end: '10:00' });
      expect(blocks[2]).toEqual({ start: '11:00', end: '12:00' });
      expect(blocks[3]).toEqual({ start: '13:00', end: '14:00' }); // skip lunch
    });

    it('should handle different slot durations', () => {
      const blocks = generateDynamicTimeBlocks({
        slotDuration: 120,
        dayStart: '08:00',
        dayEnd: '16:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
      });

      // 08-10, 10-12, 14-16 (12-14 overlaps with lunch)
      expect(blocks.length).toBe(3);
    });

    it('should not overflow beyond dayEnd', () => {
      const blocks = generateDynamicTimeBlocks({
        slotDuration: 60,
        dayStart: '16:00',
        dayEnd: '17:30',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
      });

      expect(blocks.length).toBe(1);
      expect(blocks[0]).toEqual({ start: '16:00', end: '17:00' });
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration in hours', () => {
      expect(calculateDuration('09:00', '10:00')).toBe(1);
      expect(calculateDuration('09:00', '12:00')).toBe(3);
      expect(calculateDuration('14:00', '15:30')).toBe(2); // ceil(90/60) = 2
    });
  });

  describe('timeRangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
      expect(timeRangesOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true);
    });

    it('should not detect non-overlapping ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
      expect(timeRangesOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false);
    });

    it('should handle contained ranges', () => {
      expect(timeRangesOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
    });
  });

  describe('areBlocksConsecutive', () => {
    it('should return true for consecutive blocks', () => {
      expect(areBlocksConsecutive([
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
      ])).toBe(true);
    });

    it('should return false for non-consecutive blocks', () => {
      expect(areBlocksConsecutive([
        { start: '09:00', end: '10:00' },
        { start: '11:00', end: '12:00' },
      ])).toBe(false);
    });

    it('should return true for single block', () => {
      expect(areBlocksConsecutive([
        { start: '09:00', end: '10:00' },
      ])).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(areBlocksConsecutive([])).toBe(true);
    });
  });
});
