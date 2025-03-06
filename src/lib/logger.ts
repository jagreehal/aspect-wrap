import type { Logger } from './types';

// Basic console logger implementation
export const consoleLogger: Logger = {
  debug: (obj, msg) => console.debug(`[DEBUG] ${msg}`, obj),
  info: (obj, msg) => console.log(`[INFO] ${msg}`, obj),
  warn: (obj, msg) => console.warn(`[WARN] ${msg}`, obj),
  error: (obj, msg) => console.error(`[ERROR] ${msg}`, obj),
  fatal: (obj, msg) => console.error(`[FATAL] ${msg}`, obj),
  trace: (obj, msg) => console.debug(`[TRACE] ${msg}`, obj),
};

// Default logger
export const defaultLogger = consoleLogger; 