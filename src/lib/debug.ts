/**
 * Debug logging utility
 * Only logs in development mode to keep production console clean
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export const debug = {
  /**
   * Log general debug information (only in development)
   */
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logs, even in production)
   */
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },

  /**
   * Log informational messages (only in development)
   */
  info: (...args: any[]) => {
    if (IS_DEV) {
      console.info(...args);
    }
  },

  /**
   * Start a console group (only in development)
   */
  group: (label: string) => {
    if (IS_DEV) {
      console.group(label);
    }
  },

  /**
   * End a console group (only in development)
   */
  groupEnd: () => {
    if (IS_DEV) {
      console.groupEnd();
    }
  },

  /**
   * Log a table (only in development)
   */
  table: (data: any) => {
    if (IS_DEV) {
      console.table(data);
    }
  },
};

/**
 * Always log important information regardless of environment
 * Use this for critical user-facing messages
 */
export const alwaysLog = {
  info: (...args: any[]) => console.info(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};
