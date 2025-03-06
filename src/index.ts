// Re-export the main functions
export { wrapFunction } from './lib/wrap-function';
export { wrapClass } from './lib/wrap-class';

// Re-export types that might be useful for consumers
export type {
  Logger,
  Constructor,
  BaseError,
  RetryOptions,
  HookContext,
  BaseWrapperOptions,
  WrapClassOptions,
  WrapFunctionOptions,
} from './lib/types';
