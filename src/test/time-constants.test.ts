import { describe, it, expect } from 'vitest';
import {
  generateTimeSlots,
  generateTimeBlocks,
  TIME_CONFIG,
  DAYS_TR,
  DAYS_EN,
  DAY_MAPPING,
  dayTrToEn,
  dayEnToTr,
  isValidWorkDay,
  normalizeDayName,
  isValidTimeSlot,
  timeToMinutes,
  doTimesOverlap,
  TIME_SLOTS,
  TIME_BLOCKS,
} from '@/constants/time';

describe('Time Constants', () => {
  describe('TIME_CONFIG', () => {
    it('should have correct default values', () => {
      expect(TIME_CONFIG.slotDuration).toBe(60);
      expect(TIME_CONFIG.dayStart).toBe('08:00');
      expect(TIME_CONFIG.dayEnd).toBe('18:00');
      expect(TIME_CONFIG.lunchBreak.start).toBe('12:00');
      expect(TIME_CONFIG.lunchBreak.end).toBe('13:00');
    });
  });

  describe('Day Constants', () => {
    it('should have 5 Turkish days', () => {
      expect(DAYS_TR).toHaveLength(5);
      expect(DAYS_TR[0]).toBe('Pazartesi');
      expect(DAYS_TR[4]).toBe('Cuma');
    });

    it('should have 5 English days', () => {
      expect(DAYS_EN).toHaveLength(5);
      expect(DAYS_EN[0]).toBe('monday');
      expect(DAYS_EN[4]).toBe('friday');
    });

    it('should have bidirectional day mapping', () => {
      expect(DAY_MAPPING['Pazartesi']).toBe('monday');
      expect(DAY_MAPPING['monday']).toBe('Pazartesi');
      expect(DAY_MAPPING['Cuma']).toBe('friday');
      expect(DAY_MAPPING['friday']).toBe('Cuma');
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate time slots', () => {
      const slots = generateTimeSlots();
      expect(slots.length).toBeGreaterThan(0);
      expect(slots[0]).toBe('08:00');
    });

    it('should skip lunch break (12:00-13:00)', () => {
      const slots = generateTimeSlots();
      expect(slots).not.toContain('12:00');
    });

    it('should end before dayEnd', () => {
      const slots = generateTimeSlots();
      const lastSlot = slots[slots.length - 1];
      expect(lastSlot).toBe('17:00');
    });

    it('should generate correct number of slots for default config', () => {
      const slots = generateTimeSlots();
      // 08-12 (4 slots) + 13-18 (5 slots) = 9 slots
      expect(slots).toHaveLength(9);
    });

    it('should accept custom config', () => {
      const slots = generateTimeSlots({
        ...TIME_CONFIG,
        dayStart: '09:00',
        dayEnd: '15:00',
      });
      expect(slots[0]).toBe('09:00');
    });
  });

  describe('generateTimeBlocks', () => {
    it('should generate time blocks with start and end', () => {
      const blocks = generateTimeBlocks();
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0]).toEqual({ start: '08:00', end: '09:00' });
    });

    it('should skip lunch break', () => {
      const blocks = generateTimeBlocks();
      const hasLunch = blocks.some(b => b.start === '12:00');
      expect(hasLunch).toBe(false);
    });
  });

  describe('Pre-generated constants', () => {
    it('TIME_SLOTS should be pre-generated', () => {
      expect(TIME_SLOTS).toEqual(generateTimeSlots());
    });

    it('TIME_BLOCKS should be pre-generated', () => {
      expect(TIME_BLOCKS).toEqual(generateTimeBlocks());
    });
  });

  describe('dayTrToEn', () => {
    it('should convert Turkish to English', () => {
      expect(dayTrToEn('Pazartesi')).toBe('monday');
      expect(dayTrToEn('Cuma')).toBe('friday');
    });

    it('should return lowercase for unknown day', () => {
      expect(dayTrToEn('Unknown')).toBe('unknown');
    });
  });

  describe('dayEnToTr', () => {
    it('should convert English to Turkish', () => {
      expect(dayEnToTr('monday')).toBe('Pazartesi');
      expect(dayEnToTr('friday')).toBe('Cuma');
    });

    it('should handle case-insensitive input', () => {
      expect(dayEnToTr('Monday')).toBe('Pazartesi');
    });

    it('should return original for unknown day', () => {
      expect(dayEnToTr('unknown')).toBe('unknown');
    });
  });

  describe('isValidWorkDay', () => {
    it('should accept Turkish day names', () => {
      expect(isValidWorkDay('Pazartesi')).toBe(true);
      expect(isValidWorkDay('Cuma')).toBe(true);
    });

    it('should accept English day names', () => {
      expect(isValidWorkDay('monday')).toBe(true);
      expect(isValidWorkDay('friday')).toBe(true);
    });

    it('should reject weekend days (not in DAYS_TR/DAYS_EN)', () => {
      expect(isValidWorkDay('saturday')).toBe(false);
      expect(isValidWorkDay('Cumartesi')).toBe(false);
    });

    it('should reject invalid input', () => {
      expect(isValidWorkDay('notaday')).toBe(false);
    });
  });

  describe('normalizeDayName', () => {
    it('should return Turkish name as-is', () => {
      expect(normalizeDayName('Pazartesi')).toBe('Pazartesi');
    });

    it('should convert English to Turkish', () => {
      expect(normalizeDayName('monday')).toBe('Pazartesi');
      expect(normalizeDayName('friday')).toBe('Cuma');
    });

    it('should handle case-insensitive Turkish', () => {
      expect(normalizeDayName('pazartesi')).toBe('Pazartesi');
    });

    it('should handle empty string', () => {
      expect(normalizeDayName('')).toBe('');
    });

    it('should return unknown days as-is with trimming', () => {
      expect(normalizeDayName('  Unknown  ')).toBe('Unknown');
    });
  });

  describe('isValidTimeSlot', () => {
    it('should accept valid time formats', () => {
      expect(isValidTimeSlot('08:00')).toBe(true);
      expect(isValidTimeSlot('23:59')).toBe(true);
      expect(isValidTimeSlot('00:00')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidTimeSlot('24:00')).toBe(false);
      expect(isValidTimeSlot('12:60')).toBe(false);
      expect(isValidTimeSlot('abc')).toBe(false);
      expect(isValidTimeSlot('')).toBe(false);
    });
  });

  describe('timeToMinutes', () => {
    it('should convert time string to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0);
      expect(timeToMinutes('01:00')).toBe(60);
      expect(timeToMinutes('09:30')).toBe(570);
      expect(timeToMinutes('12:00')).toBe(720);
      expect(timeToMinutes('23:59')).toBe(1439);
    });
  });

  describe('doTimesOverlap', () => {
    it('should detect overlapping times', () => {
      expect(doTimesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
    });

    it('should return false for adjacent (non-overlapping) times', () => {
      expect(doTimesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
    });

    it('should return false for completely separate times', () => {
      expect(doTimesOverlap('08:00', '09:00', '14:00', '15:00')).toBe(false);
    });

    it('should detect containment', () => {
      expect(doTimesOverlap('08:00', '12:00', '09:00', '10:00')).toBe(true);
    });

    it('should be commutative', () => {
      const a = doTimesOverlap('09:00', '10:00', '09:30', '10:30');
      const b = doTimesOverlap('09:30', '10:30', '09:00', '10:00');
      expect(a).toBe(b);
    });
  });
});
