import { describe, it, expect } from 'vitest';
import { sanitizeObject, formatError } from '@/lib/logger';

describe('Logger Utilities', () => {
  describe('sanitizeObject', () => {
    it('should redact password fields', () => {
      const obj = { username: 'admin', password: 'secret123' };
      const result = sanitizeObject(obj);
      expect(result.username).toBe('admin');
      expect(result.password).toBe('[REDACTED]');
    });

    it('should redact token fields', () => {
      const obj = { accessToken: 'abc123', refreshToken: 'xyz789', data: 'safe' };
      const result = sanitizeObject(obj);
      expect(result.accessToken).toBe('[REDACTED]');
      expect(result.refreshToken).toBe('[REDACTED]');
      expect(result.data).toBe('safe');
    });

    it('should redact nested objects', () => {
      const obj = { user: { name: 'test', passwordHash: 'hash123' } };
      const result = sanitizeObject(obj);
      expect(result.user.name).toBe('test');
      expect(result.user.passwordHash).toBe('[REDACTED]');
    });

    it('should handle arrays', () => {
      const arr = [{ token: 'abc' }, { name: 'safe' }];
      const result = sanitizeObject(arr);
      expect(result[0].token).toBe('[REDACTED]');
      expect(result[1].name).toBe('safe');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeObject(null)).toBe(null);
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    it('should handle primitive values', () => {
      expect(sanitizeObject('string')).toBe('string');
      expect(sanitizeObject(42)).toBe(42);
    });

    it('should redact various sensitive fields', () => {
      const obj = {
        apiKey: 'key123',
        secret: 'shhh',
        authorization: 'Bearer xxx',
        cookie: 'session=abc',
        csrf: 'token',
        creditCard: '4111-1111',
      };
      const result = sanitizeObject(obj);
      Object.values(result).forEach((v) => {
        expect(v).toBe('[REDACTED]');
      });
    });
  });

  describe('formatError', () => {
    it('should format Error instances', () => {
      const err = new Error('test error');
      const result = formatError(err);
      expect(result.message).toBe('test error');
      expect(result.name).toBe('Error');
      expect(result.stack).toBeDefined();
    });

    it('should format string errors', () => {
      const result = formatError('something went wrong');
      expect(result.message).toBe('something went wrong');
    });

    it('should format unknown types', () => {
      const result = formatError(42);
      expect(result.message).toBe('42');
    });

    it('should include code if present', () => {
      const err = Object.assign(new Error('db error'), { code: 'P2002' });
      const result = formatError(err);
      expect(result.code).toBe('P2002');
    });
  });
});
