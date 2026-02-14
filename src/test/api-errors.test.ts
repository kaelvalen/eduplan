import { describe, it, expect } from 'vitest';
import { ApiError, ErrorCode } from '@/lib/api-errors';

describe('API Errors', () => {
  describe('ApiError', () => {
    it('should create error with message and status code', () => {
      const error = new ApiError('Not found', 404);
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ApiError');
    });

    it('should create error with code', () => {
      const error = new ApiError('Unauthorized', 401, ErrorCode.UNAUTHORIZED);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    });

    it('should create error with details', () => {
      const error = new ApiError('Validation failed', 400, ErrorCode.VALIDATION_ERROR, {
        fields: ['name'],
      });
      expect(error.details).toEqual({ fields: ['name'] });
    });

    it('should be instance of Error', () => {
      const error = new ApiError('test', 500);
      expect(error).toBeInstanceOf(Error);
    });

    it('should have a stack trace', () => {
      const error = new ApiError('test', 500);
      expect(error.stack).toBeDefined();
    });
  });

  describe('ErrorCode', () => {
    it('should have authentication error codes', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCode.INVALID_CREDENTIALS).toBe('INVALID_CREDENTIALS');
      expect(ErrorCode.TOKEN_EXPIRED).toBe('TOKEN_EXPIRED');
    });

    it('should have validation error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT');
      expect(ErrorCode.DUPLICATE_ENTRY).toBe('DUPLICATE_ENTRY');
    });

    it('should have resource error codes', () => {
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.RESOURCE_CONFLICT).toBe('RESOURCE_CONFLICT');
    });

    it('should have server error codes', () => {
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.EXTERNAL_SERVICE_ERROR).toBe('EXTERNAL_SERVICE_ERROR');
    });

    it('should have rate limit error code', () => {
      expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should have CSRF error code', () => {
      expect(ErrorCode.CSRF_TOKEN_INVALID).toBe('CSRF_TOKEN_INVALID');
    });
  });
});
