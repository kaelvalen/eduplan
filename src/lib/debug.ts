/**
 * Debug logging utility
 * Only logs in development mode to keep production console clean
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export const debug = {
  /**
   * Log general debug information (only in development)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: (...args: any[]) => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (only in development)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]) => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },

  /**
   * Log errors (always logs, even in production)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },

  /**
   * Log informational messages (only in development)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (...args: any[]) => console.info(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]) => console.warn(...args),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => console.error(...args),
};
