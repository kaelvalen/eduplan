import { describe, it, expect } from 'vitest';
import {
  colors,
  pageConfig,
  spacing,
  typography,
  radius,
  shadows,
  animations,
  styles,
  getEntityColors,
  getStatusColors,
  getPageConfig,
  cx,
} from '@/lib/design-tokens';
import type { EntityKey, StatusKey, PageKey } from '@/lib/design-tokens';

describe('Design Tokens', () => {
  describe('colors', () => {
    it('should have all entity color definitions', () => {
      const entities: EntityKey[] = ['teachers', 'courses', 'classrooms', 'schedules', 'scheduler', 'reports', 'settings', 'import'];
      for (const entity of entities) {
        expect(colors.entities[entity]).toBeDefined();
        expect(colors.entities[entity].bg).toBeDefined();
        expect(colors.entities[entity].text).toBeDefined();
        expect(colors.entities[entity].border).toBeDefined();
        expect(colors.entities[entity].gradient).toBeDefined();
        expect(colors.entities[entity].icon).toBeDefined();
        expect(colors.entities[entity].dot).toBeDefined();
      }
    });

    it('should have all status color definitions', () => {
      const statuses: StatusKey[] = ['success', 'warning', 'error', 'info'];
      for (const status of statuses) {
        expect(colors.status[status]).toBeDefined();
        expect(colors.status[status].bg).toBeDefined();
        expect(colors.status[status].text).toBeDefined();
        expect(colors.status[status].border).toBeDefined();
      }
    });
  });

  describe('pageConfig', () => {
    it('should have configs for all pages', () => {
      const pages: PageKey[] = ['teachers', 'courses', 'classrooms', 'schedules', 'scheduler', 'reports', 'settings', 'import-export', 'profile'];
      for (const page of pages) {
        expect(pageConfig[page]).toBeDefined();
        expect(pageConfig[page].title).toBeTruthy();
        expect(pageConfig[page].description).toBeTruthy();
      }
    });
  });

  describe('spacing', () => {
    it('should have all spacing values', () => {
      expect(spacing.xs).toBeDefined();
      expect(spacing.sm).toBeDefined();
      expect(spacing.md).toBeDefined();
      expect(spacing.base).toBeDefined();
      expect(spacing.lg).toBeDefined();
      expect(spacing.xl).toBeDefined();
      expect(spacing.page).toBeDefined();
      expect(spacing.gap).toBeDefined();
    });
  });

  describe('typography', () => {
    it('should have text sizes and weights', () => {
      expect(typography.xs).toBe('text-xs');
      expect(typography.sm).toBe('text-sm');
      expect(typography.base).toBe('text-base');
      expect(typography.weight.bold).toBe('font-bold');
    });
  });

  describe('radius', () => {
    it('should have border radius values', () => {
      expect(radius.sm).toBe('rounded-lg');
      expect(radius.full).toBe('rounded-full');
    });
  });

  describe('shadows', () => {
    it('should have shadow values', () => {
      expect(shadows.sm).toBe('shadow-sm');
      expect(shadows.soft).toContain('shadow-');
    });
  });

  describe('animations', () => {
    it('should have animation class values', () => {
      expect(animations.fadeIn).toBe('animate-fade-in');
      expect(animations.pulse).toBe('animate-pulse');
    });
  });

  describe('styles', () => {
    it('should have common component styles', () => {
      expect(styles.pageContainer).toBeTruthy();
      expect(styles.card).toBeTruthy();
      expect(styles.cardHover).toBeTruthy();
      expect(styles.emptyState).toBeTruthy();
    });
  });

  describe('getEntityColors', () => {
    it('should return correct colors for each entity', () => {
      const result = getEntityColors('teachers');
      expect(result).toEqual(colors.entities.teachers);
    });

    it('should return correct colors for courses', () => {
      const result = getEntityColors('courses');
      expect(result.bg).toContain('emerald');
    });
  });

  describe('getStatusColors', () => {
    it('should return success colors', () => {
      const result = getStatusColors('success');
      expect(result).toEqual(colors.status.success);
    });

    it('should return error colors', () => {
      const result = getStatusColors('error');
      expect(result.bg).toContain('rose');
    });
  });

  describe('getPageConfig', () => {
    it('should return page config', () => {
      const result = getPageConfig('teachers');
      expect(result.title).toBe('Öğretim Elemanları');
    });
  });

  describe('cx', () => {
    it('should combine class strings', () => {
      expect(cx('a', 'b', 'c')).toBe('a b c');
    });

    it('should filter falsy values', () => {
      expect(cx('a', false, undefined, null, 'b')).toBe('a b');
    });

    it('should return empty string for no truthy values', () => {
      expect(cx(false, null, undefined)).toBe('');
    });
  });
});
