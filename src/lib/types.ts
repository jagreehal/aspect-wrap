// Type definitions for Aspect Wrap

// Logger interface matching Pino's structured logging style
export interface Logger {
  debug: (obj: Record<string, unknown>, msg?: string) => void;
  info: (obj: Record<string, unknown>, msg?: string) => void;
  warn: (obj: Record<string, unknown>, msg?: string) => void;
  error: (obj: Record<string, unknown>, msg?: string) => void;
  fatal: (obj: Record<string, unknown>, msg?: string) => void;
  trace: (obj: Record<string, unknown>, msg?: string) => void;
}

// Generic type for class constructors
export type Constructor<T = object> = new (...args: unknown[]) => T;

// Base error interface
export interface BaseError {
  status?: number;
  message: string;
}

// Base method type
export type Method = (...args: unknown[]) => unknown;

// Type for objects with string-indexed methods
export interface MethodContainer {
  [key: string]: Method | unknown;
}

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Retry options
export interface RetryOptions {
  attempts?: number;
  delay?: number;
  factor?: number;
  maxDelay?: number;
  jitter?: boolean;
  shouldRetry?: (error: BaseError) => boolean;
  logger?: Logger;
  name?: string;
}

// Hook context
export interface HookContext {
  name: string;
  startTime: number;
  duration?: number;
  error?: Error;
}

// Base wrapper options
export interface BaseWrapperOptions {
  before?: (name: string, args: unknown[], context: HookContext) => void | Promise<void>;
  after?: (name: string, result: unknown, context: HookContext) => void | Promise<void>;
  onError?: (name: string, error: Error, context: HookContext) => void | Promise<void>;
  finally?: (name: string, context: HookContext) => void | Promise<void>;
  logger?: Logger;
  logLevel?: LogLevel;
  retry?: RetryOptions;
}

// Method filter type
export type MethodFilter = ((methodName: string) => boolean) | string[];

// Class wrapping options
export interface WrapClassOptions extends BaseWrapperOptions {
  methodFilter?: MethodFilter;
  includeStatic?: boolean;
  includeInherited?: boolean;
  includePrivate?: boolean;
  includeAccessors?: boolean;
}

// Function wrapping options
export interface WrapFunctionOptions extends BaseWrapperOptions {
  name?: string;
  preserveName?: boolean;
  preserveContext?: boolean;
}

// Default retry configuration
export const DEFAULT_RETRY = {
  attempts: 3,
  delay: 100,
  factor: 2,
  maxDelay: 30_000,
  jitter: true,
} as const; 