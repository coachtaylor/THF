/**
 * Development-only logger utility
 *
 * Wraps console methods to only output in development mode.
 * console.error is always enabled for critical errors that should be
 * visible in production crash logs.
 */

const isDev = __DEV__;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  // Error logging is always enabled for production debugging
  error: (...args: any[]) => {
    console.error(...args);
  },
  // Debug is only for verbose development logging
  debug: (...args: any[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },
};

export default logger;
