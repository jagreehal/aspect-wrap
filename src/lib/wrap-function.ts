import type { HookContext, WrapFunctionOptions } from './types';
import { defaultLogger } from './logger';
import { executeWithRetry } from './retry';

// Wrap a function with additional behavior
export function wrapFunction<Args extends unknown[], Result>(
  fn: (...args: Args) => Result,
  options?: WrapFunctionOptions,
): (...args: Args) => Promise<Result> {
  const logger = options?.logger ?? defaultLogger;
  const name = options?.name ?? (fn.name || 'anonymous');
  const defaultOptions: WrapFunctionOptions = {
    preserveName: true,
    preserveContext: true,
    ...options,
  };

  const wrapped = function (this: unknown, ...args: Args): Promise<Result> {
    const context: HookContext = {
      name,
      startTime: Date.now(),
    };

    const handleError = (error: Error) => {
      context.error = error;
      context.duration = Date.now() - context.startTime;
      defaultOptions.onError?.(name, error, context);
      logger.error(
        { error },
        `Error in function ${name}`,
      );
      throw error;
    };

    try {
      defaultOptions.before?.(name, args, context);
      logger.info({ args }, `Entering function ${name}`);

      const exec = () =>
        defaultOptions.preserveContext ? fn.apply(this, args) : fn(...args);

      return executeWithRetry(exec, {
        ...defaultOptions.retry,
        logger,
        name: `function ${name}`,
      })
        .then((result) => {
          context.duration = Date.now() - context.startTime;
          
          const logObj: Record<string, unknown> = {};
          
          if (result !== undefined) {
            logObj.result = result;
          }
          
          logger.info(logObj, `Exiting function ${name}`);
          defaultOptions.after?.(name, result, context);
          return result as Result;
        })
        .catch(handleError)
        .finally(() => {
          defaultOptions.finally?.(name, context);
        });
    } catch (error) {
      return Promise.reject(handleError(error as Error));
    }
  };

  // Preserve the original function name if requested
  if (defaultOptions.preserveName) {
    Object.defineProperty(wrapped, 'name', { value: name });
  }

  return wrapped;
} 