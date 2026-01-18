/**
 * Middleware Exports
 * Central export point for all middleware
 */

export {
  validateRequest,
  validateQuery,
  errorResponse,
  withValidation,
  withErrorHandling,
  type ValidationError,
  type ApiError,
} from './validation';

export {
  requireAuth,
  requireAdmin,
  withAuth,
  withAdmin,
  withAuthAndValidation,
  withAdminAndValidation,
  type AuthenticatedRequest,
} from './auth';
