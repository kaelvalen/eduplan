import { describe, it, expect } from 'vitest';
import { cn, formatDate } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (classnames merge)', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
    });

    it('should merge tailwind classes and resolve conflicts', () => {
      expect(cn('px-4 py-2', 'px-8')).toBe('py-2 px-8');
    });

    it('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle object syntax', () => {
      expect(cn({ 'bg-red-500': true, 'text-white': true, hidden: false })).toBe('bg-red-500 text-white');
    });

    it('should handle array syntax', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar');
    });
  });

  describe('formatDate', () => {
    it('should format Date object to Turkish locale', () => {
      const date = new Date('2026-01-15');
      const result = formatDate(date);
      expect(result).toContain('2026');
      expect(result).toContain('15');
    });

    it('should format date string', () => {
      const result = formatDate('2026-06-01');
      expect(result).toContain('2026');
    });

    it('should handle ISO date strings', () => {
      const result = formatDate('2026-03-15T10:30:00Z');
      expect(result).toContain('2026');
    });
  });
});
