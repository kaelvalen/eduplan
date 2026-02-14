import { describe, it, expect } from 'vitest';
import {
  parseAvailableHours,
  stringifyAvailableHours,
  normalizeToRanges,
  isAvailableAt,
  convertHoursToEn,
  convertHoursToTr,
  parseTimeRange,
  formatTimeRange,
  getStartTime,
  getEndTime,
  getEmptyHours,
  parseTeacherWorkingHoursSafe,
} from '@/lib/time-utils';

describe('Time Utils', () => {
  describe('getEmptyHours', () => {
    it('should return empty arrays for all Turkish weekdays', () => {
      const hours = getEmptyHours();
      expect(hours['Pazartesi']).toEqual([]);
      expect(hours['Salı']).toEqual([]);
      expect(hours['Çarşamba']).toEqual([]);
      expect(hours['Perşembe']).toEqual([]);
      expect(hours['Cuma']).toEqual([]);
    });

    it('should not include weekend days', () => {
      const hours = getEmptyHours();
      expect(hours['Cumartesi']).toBeUndefined();
      expect(hours['Pazar']).toBeUndefined();
    });
  });

  describe('parseAvailableHours', () => {
    it('should parse valid JSON with Turkish day keys', () => {
      const json = JSON.stringify({
        Pazartesi: ['09:00-10:00', '10:00-11:00'],
        Salı: ['14:00-15:00'],
      });
      const result = parseAvailableHours(json);
      expect(result['Pazartesi']).toEqual(['09:00-10:00', '10:00-11:00']);
      expect(result['Salı']).toEqual(['14:00-15:00']);
      expect(result['Çarşamba']).toEqual([]);
    });

    it('should convert old slot format to range format', () => {
      const json = JSON.stringify({
        Pazartesi: ['09:00', '10:00'],
      });
      const result = parseAvailableHours(json);
      expect(result['Pazartesi']).toEqual(['09:00-10:00', '10:00-11:00']);
    });

    it('should handle English day keys by mapping to Turkish', () => {
      const json = JSON.stringify({
        monday: ['09:00-10:00'],
        tuesday: ['14:00-15:00'],
      });
      const result = parseAvailableHours(json);
      expect(result['Pazartesi']).toEqual(['09:00-10:00']);
      expect(result['Salı']).toEqual(['14:00-15:00']);
    });

    it('should return empty hours for invalid JSON', () => {
      const result = parseAvailableHours('not-json');
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should return empty hours for empty string', () => {
      const result = parseAvailableHours('');
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should return empty hours for null-like JSON', () => {
      const result = parseAvailableHours('null');
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should filter out invalid time formats', () => {
      const json = JSON.stringify({
        Pazartesi: ['09:00-10:00', 'invalid', '10:00-11:00', ''],
      });
      const result = parseAvailableHours(json);
      expect(result['Pazartesi']).toEqual(['09:00-10:00', '10:00-11:00']);
    });
  });

  describe('stringifyAvailableHours', () => {
    it('should convert hours map to JSON string', () => {
      const hours = { Pazartesi: ['09:00-10:00'], Salı: [] as string[] };
      const result = stringifyAvailableHours(hours);
      expect(JSON.parse(result)).toEqual(hours);
    });
  });

  describe('normalizeToRanges', () => {
    it('should pass through range format as-is', () => {
      expect(normalizeToRanges(['09:00-10:00', '14:00-15:00'])).toEqual([
        '09:00-10:00',
        '14:00-15:00',
      ]);
    });

    it('should convert slot format to range format', () => {
      expect(normalizeToRanges(['09:00', '14:00'])).toEqual([
        '09:00-10:00',
        '14:00-15:00',
      ]);
    });

    it('should handle mixed formats', () => {
      expect(normalizeToRanges(['09:00-10:00', '14:00'])).toEqual([
        '09:00-10:00',
        '14:00-15:00',
      ]);
    });

    it('should filter out empty strings', () => {
      expect(normalizeToRanges(['', '09:00-10:00'])).toEqual(['09:00-10:00']);
    });
  });

  describe('isAvailableAt', () => {
    it('should return true when teacher has matching time slot', () => {
      const hours = { Pazartesi: ['09:00-10:00', '10:00-11:00'] };
      expect(isAvailableAt(hours, 'Pazartesi', '09:00')).toBe(true);
    });

    it('should return false when teacher has no matching slot', () => {
      const hours = { Pazartesi: ['09:00-10:00'] };
      expect(isAvailableAt(hours, 'Pazartesi', '14:00')).toBe(false);
    });

    it('should return true when hours map is empty (no restrictions)', () => {
      expect(isAvailableAt({}, 'Pazartesi', '09:00')).toBe(true);
    });

    it('should return false when day has no slots', () => {
      const hours = { Pazartesi: ['09:00-10:00'], Salı: [] as string[] };
      expect(isAvailableAt(hours, 'Salı', '09:00')).toBe(false);
    });

    it('should handle merged time ranges', () => {
      const hours = { Pazartesi: ['09:00-11:00'] };
      expect(isAvailableAt(hours, 'Pazartesi', '09:00')).toBe(true);
      expect(isAvailableAt(hours, 'Pazartesi', '10:00')).toBe(true);
    });

    it('should handle English day names via mapping', () => {
      const hours = { Pazartesi: ['09:00-10:00'] };
      expect(isAvailableAt(hours, 'monday', '09:00')).toBe(true);
    });
  });

  describe('convertHoursToEn', () => {
    it('should convert Turkish day keys to English', () => {
      const hours = { Pazartesi: ['09:00-10:00'], Salı: ['14:00-15:00'] };
      const result = convertHoursToEn(hours);
      expect(result['monday']).toEqual(['09:00-10:00']);
      expect(result['tuesday']).toEqual(['14:00-15:00']);
    });
  });

  describe('convertHoursToTr', () => {
    it('should convert English day keys to Turkish', () => {
      const hours = { monday: ['09:00-10:00'], tuesday: ['14:00-15:00'] };
      const result = convertHoursToTr(hours);
      expect(result['Pazartesi']).toEqual(['09:00-10:00']);
      expect(result['Salı']).toEqual(['14:00-15:00']);
    });
  });

  describe('parseTimeRange', () => {
    it('should parse valid time range', () => {
      expect(parseTimeRange('09:00-10:00')).toEqual({ start: '09:00', end: '10:00' });
    });

    it('should parse range with spaces', () => {
      expect(parseTimeRange('09:00 - 10:00')).toEqual({ start: '09:00', end: '10:00' });
    });

    it('should return null for invalid format', () => {
      expect(parseTimeRange('invalid')).toBeNull();
    });

    it('should return null for single time', () => {
      expect(parseTimeRange('09:00')).toBeNull();
    });
  });

  describe('formatTimeRange', () => {
    it('should format start and end to range string', () => {
      expect(formatTimeRange('09:00', '10:00')).toBe('09:00-10:00');
    });
  });

  describe('getStartTime / getEndTime', () => {
    it('should extract start time from range', () => {
      expect(getStartTime('09:00-10:00')).toBe('09:00');
    });

    it('should extract end time from range', () => {
      expect(getEndTime('09:00-10:00')).toBe('10:00');
    });

    it('should handle empty string', () => {
      expect(getStartTime('')).toBe('');
      expect(getEndTime('')).toBe('');
    });
  });

  describe('parseTeacherWorkingHoursSafe', () => {
    it('should parse valid working hours JSON', () => {
      const json = JSON.stringify({ Pazartesi: ['09:00-10:00'] });
      const result = parseTeacherWorkingHoursSafe(json);
      expect(result['Pazartesi']).toEqual(['09:00-10:00']);
    });

    it('should return empty hours for null', () => {
      const result = parseTeacherWorkingHoursSafe(null);
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should return empty hours for undefined', () => {
      const result = parseTeacherWorkingHoursSafe(undefined);
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should return empty hours for empty string', () => {
      const result = parseTeacherWorkingHoursSafe('');
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should return empty hours for invalid JSON', () => {
      const result = parseTeacherWorkingHoursSafe('not-json');
      expect(result['Pazartesi']).toEqual([]);
    });

    it('should filter out non-string values', () => {
      const json = JSON.stringify({ Pazartesi: ['09:00-10:00', 123, null] });
      const result = parseTeacherWorkingHoursSafe(json);
      expect(result['Pazartesi']).toEqual(['09:00-10:00']);
    });
  });
});
