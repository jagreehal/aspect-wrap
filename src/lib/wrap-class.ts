import type { Constructor, HookContext, MethodContainer, MethodFilter, WrapClassOptions, Method } from './types';
import { defaultLogger } from './logger';
import { executeWithRetry } from './retry';

// Helper function to check if a method should be wrapped
function shouldWrapMethod(
  name: string,
  filter: MethodFilter | undefined,
  options: WrapClassOptions,
  isInherited = false,
): boolean {
  // Skip if no filter or options
  if (!filter && !options) return true;

  // Skip inherited methods if not enabled
  if (isInherited && !options.includeInherited) return false;

  // Check if method should be included based on naming conventions
  if (!options.includePrivate && name.startsWith('_')) return false;
  if (name === 'constructor') return false;

  // Apply method filter if provided
  if (filter) {
    if (Array.isArray(filter)) {
      return filter.includes(name);
    }
    return filter(name);
  }

  return true;
}

// Wrap a class with additional behavior
export function wrapClass<T extends Constructor>(
  BaseClass: T,
  options?: WrapClassOptions,
): T {
  const logger = options?.logger ?? defaultLogger;
  const defaultOptions: WrapClassOptions = {
    includeStatic: true,
    includeInherited: false,
    includePrivate: false,
    includeAccessors: false,
    ...options,
  };

  // Create a wrapped class using a function to avoid TypeScript mixin constraints
  const Wrapped = function (this: InstanceType<T>, ...args: unknown[]) {
    // Call the original constructor
    const instance = new BaseClass(...args);
    Object.setPrototypeOf(this, Object.getPrototypeOf(instance));
    
    // Copy instance properties
    Object.assign(this, instance);

    // Get all instance methods to wrap
    const methodNames = Object.getOwnPropertyNames(
      BaseClass.prototype,
    ).filter((name) =>
      shouldWrapMethod(
        name,
        defaultOptions.methodFilter,
        defaultOptions,
        false,
      ),
    );

    // Add inherited methods if requested
    if (defaultOptions.includeInherited) {
      let proto = Object.getPrototypeOf(BaseClass.prototype);
      while (proto && proto !== Object.prototype) {
        methodNames.push(
          ...Object.getOwnPropertyNames(proto).filter((name) =>
            shouldWrapMethod(
              name,
              defaultOptions.methodFilter,
              defaultOptions,
              true,
            ),
          ),
        );
        proto = Object.getPrototypeOf(proto);
      }
    }

    for (const name of methodNames) {
      const original = (this as unknown as MethodContainer)[name] as Method;
      if (typeof original !== 'function') continue;
      
      (this as unknown as MethodContainer)[name] = function (
        this: unknown,
        ...args: unknown[]
      ) {
        const context: HookContext = {
          name,
          startTime: Date.now(),
        };

        const handleError = (error: Error) => {
          context.error = error;
          context.duration = Date.now() - context.startTime;
          defaultOptions.onError?.(name, error, context);
          logger.error(
            { method: name, error },
            `Error in ${name}`,
          );
          throw error;
        };

        try {
          defaultOptions.before?.(name, args, context);
          logger.info({ method: name, args }, `Entering ${name}`);

          const exec = () => original.apply(this, args);
          return executeWithRetry(exec, {
            ...defaultOptions.retry,
            logger,
            name,
          })
            .then((result) => {
              // Calculate duration for backward compatibility with tests
              context.duration = Date.now() - context.startTime;
              
              const logObj: Record<string, unknown> = { method: name };
              
              if (result !== undefined) {
                logObj.result = result;
              }
              
              logger.info(logObj, `Exiting ${name}`);
              defaultOptions.after?.(name, result, context);
              return result;
            })
            .catch(handleError)
            .finally(() => {
              defaultOptions.finally?.(name, context);
            });
        } catch (error) {
          return Promise.reject(handleError(error as Error));
        }
      };
    }
  } as unknown as T;

  // Set up the prototype chain correctly
  Wrapped.prototype = Object.create(BaseClass.prototype);
  Wrapped.prototype.constructor = Wrapped;

  // Create a non-generic type for static methods
  const BaseClassWithMethods = BaseClass as unknown as MethodContainer;
  const WrappedWithMethods = Wrapped as unknown as MethodContainer;

  // Copy static properties
  for (const prop of Object.getOwnPropertyNames(BaseClass)) {
    if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
      Object.defineProperty(
        Wrapped,
        prop,
        Object.getOwnPropertyDescriptor(BaseClass, prop) || Object.create(null)
      );
    }
  }

  // Wrap static methods if enabled
  if (defaultOptions.includeStatic) {
    const staticNames = Object.getOwnPropertyNames(BaseClass).filter(
      (name) =>
        !['prototype', 'name', 'length'].includes(name) &&
        typeof BaseClassWithMethods[name] === 'function' &&
        shouldWrapMethod(
          name,
          defaultOptions.methodFilter,
          defaultOptions,
          false,
        ),
    );

    for (const name of staticNames) {
      const originalStatic = BaseClassWithMethods[name] as Method;
      WrappedWithMethods[name] = function (...args: unknown[]) {
        const context: HookContext = {
          name: `static ${name}`,
          startTime: Date.now(),
        };

        const handleError = (error: Error) => {
          context.error = error;
          context.duration = Date.now() - context.startTime;
          defaultOptions.onError?.(name, error, context);
          logger.error(
            { method: name, error },
            `Error in static ${name}`,
          );
          throw error;
        };

        try {
          defaultOptions.before?.(name, args, context);
          logger.info({ method: name, args }, `Entering static ${name}`);

          const exec = () => originalStatic.apply(BaseClass, args);
          return executeWithRetry(exec, {
            ...defaultOptions.retry,
            logger,
            name,
          })
            .then((result) => {
              context.duration = Date.now() - context.startTime;
              
              const logObj: Record<string, unknown> = { method: name };
              
              if (result !== undefined) {
                logObj.result = result;
              }
              
              logger.info(logObj, `Exiting static ${name}`);
              defaultOptions.after?.(name, result, context);
              return result;
            })
            .catch(handleError)
            .finally(() => {
              defaultOptions.finally?.(name, context);
            });
        } catch (error) {
          return Promise.reject(handleError(error as Error));
        }
      };
    }
  }

  return Wrapped;
} 