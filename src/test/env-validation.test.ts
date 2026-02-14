import { describe, it, expect } from 'vitest';
import {
  validateEnvironment,
  getRequiredEnv,
  getOptionalEnv,
  isProduction,
  isDevelopment,
  isTest,
} from '@/lib/env-validation';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateEnvironment', () => {
    it('should pass when JWT_SECRET is set', () => {
      process.env.JWT_SECRET = 'test-secret';
      expect(() => validateEnvironment()).not.toThrow();
    });

    it('should throw when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET;
      expect(() => validateEnvironment()).toThrow('Missing Required Environment Variables');
    });
  });

  describe('getRequiredEnv', () => {
    it('should return the value when set', () => {
      process.env.MY_VAR = 'hello';
      expect(getRequiredEnv('MY_VAR')).toBe('hello');
    });

    it('should throw when not set', () => {
      delete process.env.MY_VAR;
      expect(() => getRequiredEnv('MY_VAR')).toThrow('MY_VAR is not set');
    });
  });

  describe('getOptionalEnv', () => {
    it('should return the value when set', () => {
      process.env.MY_VAR = 'hello';
      expect(getOptionalEnv('MY_VAR', 'default')).toBe('hello');
    });

    it('should return default when not set', () => {
      delete process.env.MY_VAR;
      expect(getOptionalEnv('MY_VAR', 'fallback')).toBe('fallback');
    });
  });

  describe('environment checks', () => {
    it('isProduction should detect production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
      expect(isDevelopment()).toBe(false);
    });

    it('isDevelopment should detect development', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });

    it('isTest should detect test', () => {
      process.env.NODE_ENV = 'test';
      expect(isTest()).toBe(true);
    });
  });
});
