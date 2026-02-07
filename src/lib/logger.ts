import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for file
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define transports
const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: consoleFormat,
  }),
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false,
});

// Helper functions for structured logging
export const logApiRequest = (data: {
  method: string;
  path: string;
  userId?: number;
  duration?: number;
  status?: number;
}) => {
  logger.http('API Request', data);
};

export const logApiError = (data: {
  method: string;
  path: string;
  error: string;
  stack?: string;
  userId?: number;
}) => {
  logger.error('API Error', data);
};

export const logSchedulerEvent = (data: {
  action: string;
  status: 'started' | 'success' | 'failed';
  duration?: number;
  coursesProcessed?: number;
  scheduledCount?: number;
  error?: string;
}) => {
  const level = data.status === 'failed' ? 'error' : 'info';
  logger.log(level, 'Scheduler Event', data);
};

export const logDatabaseQuery = (data: {
  query: string;
  duration?: number;
  error?: string;
}) => {
  if (data.error) {
    logger.error('Database Error', data);
  } else {
    logger.debug('Database Query', data);
  }
};

/**
 * Sensitive fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'csrf',
  'ssn',
  'creditCard',
];

/**
 * Sanitize object by redacting sensitive fields
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check if key contains sensitive field names
    const isSensitive = SENSITIVE_FIELDS.some((field) =>
      lowerKey.includes(field.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Safe logger that automatically sanitizes sensitive data
 */
export const safeLogger = {
  error: (message: string, meta?: any) => {
    logger.error(message, meta ? sanitizeObject(meta) : undefined);
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta ? sanitizeObject(meta) : undefined);
  },
  info: (message: string, meta?: any) => {
    logger.info(message, meta ? sanitizeObject(meta) : undefined);
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta ? sanitizeObject(meta) : undefined);
  },
  http: (message: string, meta?: any) => {
    logger.http(message, meta ? sanitizeObject(meta) : undefined);
  },
};

/**
 * Format error for logging
 */
export function formatError(error: unknown): {
  message: string;
  stack?: string;
  code?: string;
  name?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: (error as any).code,
    };
  }

  return {
    message: String(error),
  };
}

export default logger;
