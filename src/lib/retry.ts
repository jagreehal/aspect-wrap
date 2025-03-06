import type { BaseError, RetryOptions } from './types';
import { DEFAULT_RETRY } from './types';

// Default retry predicate - retry on HTTP 429 and 503
export function defaultShouldRetry(error: BaseError): boolean {
  if (error && typeof error.status === 'number') {
    return error.status === 429 || error.status === 503;
  }
  return true;
}

// Execute a function with retry logic
export async function executeWithRetry(
  fn: () => unknown,
  retry?: RetryOptions,
): Promise<unknown> {
  const config = retry ?? {};
  const attempts = config.attempts ?? DEFAULT_RETRY.attempts;
  const delay = config.delay ?? DEFAULT_RETRY.delay;
  const factor = config.factor ?? DEFAULT_RETRY.factor;
  const maxDelay = config.maxDelay ?? DEFAULT_RETRY.maxDelay;
  const jitter = config.jitter ?? DEFAULT_RETRY.jitter;
  const shouldRetry = config.shouldRetry ?? defaultShouldRetry;
  const { logger, name } = config;

  let remaining = attempts;
  let currentDelay = delay;

  while (true) {
    try {
      const result = fn();
      return result instanceof Promise ? await result : result;
    } catch (error) {
      const baseError = error as BaseError;
      if (!shouldRetry(baseError)) throw error;
      if (--remaining <= 0) throw error;
      
      if (logger && name) {
        logger.error(
          { error: baseError, remainingAttempts: remaining },
          `Error in ${name}, retrying...`,
        );
      }

      // Apply jitter to avoid thundering herd
      const finalDelay = jitter
        ? currentDelay * (0.5 + Math.random())
        : currentDelay;

      await new Promise((res) => setTimeout(res, Math.min(finalDelay, maxDelay)));
      currentDelay *= factor;
    }
  }
} 