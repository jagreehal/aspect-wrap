// wrapClass.test.ts
import { describe, expect, it, vi } from 'vitest';
import { wrapClass, wrapFunction } from './index';

// Define types for test logger
interface LogEntry {
  level: 'info' | 'error' | 'debug' | 'warn' | 'fatal' | 'trace';
  msg: string;
  obj: Record<string, unknown>;
}

// Helper: a test logger that collects logs for assertions.
function createTestLogger() {
  const logs: LogEntry[] = [];
  return {
    logger: {
      info: (obj: Record<string, unknown>, msg?: string) => {
        logs.push({ level: 'info', msg: msg ?? '', obj });
        return logs.length;
      },
      error: (obj: Record<string, unknown>, msg?: string) => {
        logs.push({ level: 'error', msg: msg ?? '', obj });
        return logs.length;
      },
      debug: (obj: Record<string, unknown>, msg?: string) => {
        logs.push({ level: 'debug', msg: msg ?? '', obj });
        return logs.length;
      },
      warn: (obj: Record<string, unknown>, msg?: string) => {
        logs.push({ level: 'warn', msg: msg ?? '', obj });
        return logs.length;
      },
      fatal: (obj: Record<string, unknown>, msg?: string) => {
        logs.push({ level: 'fatal', msg: msg ?? '', obj });
        return logs.length;
      },
      trace: (obj: Record<string, unknown>, msg?: string) => {
        logs.push({ level: 'trace', msg: msg ?? '', obj });
        return logs.length;
      },
    },
    logs,
  };
}

// Sample class hierarchy to test inheritance
class Animal {
  protected _type: string;
  constructor(type: string) {
    this._type = type;
  }

  makeSound(): string {
    return 'generic sound';
  }

  protected _eat(): string {
    return 'eating';
  }

  // Add a new method that won't be overridden
  sleep(): string {
    return 'sleeping';
  }
}

class Dog extends Animal {
  constructor() {
    super('dog');
  }

  override makeSound(): string {
    return 'woof';
  }

  fetch(): string {
    return 'fetching ball';
  }
}

// Sample class to test instance and async methods.
class Calculator {
  _lastResult = 0;

  add(a: number, b: number): number {
    this._lastResult = a + b;
    return this._lastResult;
  }

  async asyncMultiply(a: number, b: number): Promise<number> {
    return new Promise((resolve) => setTimeout(() => resolve(a * b), 50));
  }

  static subtract(a: number, b: number): number {
    return a - b;
  }

  get lastResult(): number {
    return this._lastResult;
  }

  set lastResult(value: number) {
    this._lastResult = value;
  }
}

describe('wrapClass', () => {
  describe('Basic Functionality', () => {
    it('wraps instance methods and logs calls with before/after hooks', async () => {
      const testLogger = createTestLogger();
      const beforeHook = vi.fn();
      const afterHook = vi.fn();

      const WrappedCalculator = wrapClass(Calculator, {
        logger: testLogger.logger,
        before: beforeHook,
        after: afterHook,
      });

      const calc = new WrappedCalculator();
      const sum = await calc.add(2, 3);
      expect(sum).toBe(5);

      expect(beforeHook).toHaveBeenCalledWith(
        'add',
        [2, 3],
        expect.any(Object),
      );
      expect(afterHook).toHaveBeenCalledWith('add', 5, expect.any(Object));

      expect(
        testLogger.logs.some((log) => log.msg.includes('Entering add')),
      ).toBe(true);
      expect(
        testLogger.logs.some((log) => log.msg.includes('Exiting add')),
      ).toBe(true);
    });

    it('wraps async methods', async () => {
      const testLogger = createTestLogger();
      const WrappedCalculator = wrapClass(Calculator, {
        logger: testLogger.logger,
      });
      const calc = new WrappedCalculator();
      const product = await calc.asyncMultiply(3, 4);
      expect(product).toBe(12);
      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Entering asyncMultiply'),
        ),
      ).toBe(true);
      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Exiting asyncMultiply'),
        ),
      ).toBe(true);
    });

    it('wraps static methods', async () => {
      const testLogger = createTestLogger();
      const WrappedCalculator = wrapClass(Calculator, {
        logger: testLogger.logger,
      });
      const difference = await WrappedCalculator.subtract(10, 4);
      expect(difference).toBe(6);
      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Entering static subtract'),
        ),
      ).toBe(true);
      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Exiting static subtract'),
        ),
      ).toBe(true);
    });
  });

  describe('Method Filtering', () => {
    it('supports array-based method filtering', async () => {
      const testLogger = createTestLogger();
      const WrappedCalculator = wrapClass(Calculator, {
        logger: testLogger.logger,
        methodFilter: ['add'], // Only wrap add method
      });

      const calc = new WrappedCalculator();
      await calc.add(1, 2);
      await calc.asyncMultiply(2, 3);

      const addLogs = testLogger.logs.filter((log) => log.msg.includes('add'));
      const multiplyLogs = testLogger.logs.filter((log) =>
        log.msg.includes('asyncMultiply'),
      );
      expect(addLogs.length).toBeGreaterThan(0);
      expect(multiplyLogs.length).toBe(0);
    });

    it('supports predicate-based method filtering', async () => {
      const testLogger = createTestLogger();
      const WrappedCalculator = wrapClass(Calculator, {
        logger: testLogger.logger,
        methodFilter: (name) => name.startsWith('async'),
      });

      const calc = new WrappedCalculator();
      await calc.add(1, 2);
      await calc.asyncMultiply(2, 3);

      const addLogs = testLogger.logs.filter((log) => log.msg.includes('add'));
      const multiplyLogs = testLogger.logs.filter((log) =>
        log.msg.includes('asyncMultiply'),
      );
      expect(addLogs.length).toBe(0);
      expect(multiplyLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Inheritance and Access Control', () => {
    it('handles inherited methods when enabled', async () => {
      const testLogger = createTestLogger();
      const WrappedDog = wrapClass(Dog, {
        logger: testLogger.logger,
        includeInherited: true,
      });

      const dog = new WrappedDog();
      await dog.sleep(); // Test inherited method that isn't overridden

      expect(testLogger.logs.some((log) => log.msg.includes('sleep'))).toBe(
        true,
      );
    });

    it('ignores inherited methods when disabled', async () => {
      const testLogger = createTestLogger();
      const WrappedDog = wrapClass(Dog, {
        logger: testLogger.logger,
        includeInherited: false,
      });

      const dog = new WrappedDog();
      await dog.sleep(); // Test inherited method that isn't overridden

      expect(testLogger.logs.some((log) => log.msg.includes('sleep'))).toBe(
        false,
      );
    });

    it('respects private method filtering', async () => {
      const testLogger = createTestLogger();
      const WrappedDog = wrapClass(Dog, {
        logger: testLogger.logger,
        includePrivate: false,
      });

      const dog = new WrappedDog();
      const proto = Object.getPrototypeOf(dog);
      expect(proto._eat).toBeDefined();
      expect(typeof proto._eat).toBe('function');
    });
  });

  describe('Error Handling and Hooks', () => {
    it('provides error context to error hooks', async () => {
      const testLogger = createTestLogger();
      const onError = vi.fn();
      const finally_ = vi.fn();

      class Faulty {
        throwError(): never {
          throw new Error('Intentional error');
        }
      }

      const WrappedFaulty = wrapClass(Faulty, {
        logger: testLogger.logger,
        onError,
        finally: finally_,
      });

      const instance = new WrappedFaulty();
      await expect(instance.throwError()).rejects.toThrow('Intentional error');

      expect(onError).toHaveBeenCalledWith(
        'throwError',
        expect.any(Error),
        expect.objectContaining({
          name: 'throwError',
          startTime: expect.any(Number),
          duration: expect.any(Number),
          error: expect.any(Error),
        }),
      );

      expect(finally_).toHaveBeenCalledWith(
        'throwError',
        expect.objectContaining({
          name: 'throwError',
          startTime: expect.any(Number),
          duration: expect.any(Number),
          error: expect.any(Error),
        }),
      );
    });
  });

  describe('Retry Behavior', () => {
    it('retries failed calls with jitter', async () => {
      const testLogger = createTestLogger();
      let attempts = 0;
      const delays: number[] = [];

      class Flaky {
        doSomething(): number {
          attempts++;
          if (attempts < 3) {
            const error = new Error('Temporary failure') as Error & {
              status: number;
            };
            error.status = 429;
            throw error;
          }
          return 42;
        }
      }

      // Mock setTimeout to capture delays
      vi.spyOn(globalThis, 'setTimeout').mockImplementation(
        (callback: () => void, ms?: number): NodeJS.Timeout => {
          if (ms) delays.push(ms);
          callback();
          return {} as NodeJS.Timeout;
        },
      );

      const WrappedFlaky = wrapClass(Flaky, {
        logger: testLogger.logger,
        retry: {
          attempts: 3,
          delay: 100,
          jitter: true,
          maxDelay: 1000,
        },
      });

      const instance = new WrappedFlaky();
      const result = await instance.doSomething();

      expect(result).toBe(42);
      expect(attempts).toBe(3);
      expect(delays.length).toBe(2); // Two retries
      for (const delay of delays) {
        expect(delay).toBeGreaterThan(50); // With jitter, delay should be > 50% of base
        expect(delay).toBeLessThan(1000); // Should respect maxDelay
      }

      vi.restoreAllMocks();
    });

    it('does not retry non-retryable errors', async () => {
      const testLogger = createTestLogger();
      let attempts = 0;

      class NonRetryable {
        doSomething(): never {
          attempts++;
          const error = new Error('Fatal error') as Error & { status: number };
          error.status = 401;
          throw error;
        }
      }

      const WrappedNonRetryable = wrapClass(NonRetryable, {
        logger: testLogger.logger,
        retry: { attempts: 3, delay: 10 },
      });

      const instance = new WrappedNonRetryable();
      await expect(instance.doSomething()).rejects.toThrow('Fatal error');
      expect(attempts).toBe(1);
    });
  });
});

describe('wrapFunction', () => {
  describe('Basic Functionality', () => {
    it('wraps synchronous functions with logging and hooks', async () => {
      const testLogger = createTestLogger();
      const beforeHook = vi.fn();
      const afterHook = vi.fn();

      function add(a: number, b: number): number {
        return a + b;
      }

      const wrappedAdd = wrapFunction(add, {
        logger: testLogger.logger,
        before: beforeHook,
        after: afterHook,
        name: 'add',
      });

      const result = await wrappedAdd(2, 3);
      expect(result).toBe(5);

      expect(beforeHook).toHaveBeenCalledWith(
        'add',
        [2, 3],
        expect.any(Object),
      );
      expect(afterHook).toHaveBeenCalledWith('add', 5, expect.any(Object));

      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Entering function add'),
        ),
      ).toBe(true);
      expect(
        testLogger.logs.some((log) => log.msg.includes('Exiting function add')),
      ).toBe(true);
    });

    it('wraps asynchronous functions', async () => {
      const testLogger = createTestLogger();

      async function asyncMultiply(a: number, b: number): Promise<number> {
        return new Promise((resolve) => setTimeout(() => resolve(a * b), 50));
      }

      const wrappedMultiply = wrapFunction(asyncMultiply, {
        logger: testLogger.logger,
        name: 'asyncMultiply',
      });

      const result = await wrappedMultiply(4, 5);
      expect(result).toBe(20);

      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Entering function asyncMultiply'),
        ),
      ).toBe(true);
      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Exiting function asyncMultiply'),
        ),
      ).toBe(true);
    });
  });

  describe('Context and Name Preservation', () => {
    it('preserves function name when requested', async () => {
      function namedFunction(x: number): number {
        return x * 2;
      }

      const wrapped = wrapFunction(namedFunction, {
        preserveName: true,
      });

      expect(wrapped.name).toBe('namedFunction');
    });

    it('preserves this context when requested', async () => {
      const obj = {
        value: 42,
        getValue(): number {
          return this.value;
        },
      };

      const wrapped = wrapFunction(obj.getValue, {
        preserveContext: true,
      });

      const result = await wrapped.call(obj);
      expect(result).toBe(42);
    });

    it('uses provided name over original', async () => {
      const testLogger = createTestLogger();

      function originalName(): void {}

      const wrapped = wrapFunction(originalName, {
        name: 'newName',
        logger: testLogger.logger,
      });

      await wrapped();

      expect(
        testLogger.logs.some((log) =>
          log.msg.includes('Entering function newName'),
        ),
      ).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('provides error context to hooks', async () => {
      const testLogger = createTestLogger();
      const onError = vi.fn();
      const finally_ = vi.fn();

      function throwError(): never {
        throw new Error('Intentional error');
      }

      const wrapped = wrapFunction(throwError, {
        logger: testLogger.logger,
        onError,
        finally: finally_,
      });

      await expect(wrapped()).rejects.toThrow('Intentional error');

      expect(onError).toHaveBeenCalledWith(
        'throwError',
        expect.any(Error),
        expect.objectContaining({
          startTime: expect.any(Number),
          duration: expect.any(Number),
          error: expect.any(Error),
        }),
      );

      expect(finally_).toHaveBeenCalled();
    });

    it('handles errors in async functions', async () => {
      const testLogger = createTestLogger();
      const onError = vi.fn();

      async function throwAsyncError(): Promise<never> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        throw new Error('Async error');
      }

      const wrapped = wrapFunction(throwAsyncError, {
        logger: testLogger.logger,
        onError,
      });

      await expect(wrapped()).rejects.toThrow('Async error');
      expect(onError).toHaveBeenCalled();
    });
  });

  describe('Retry Behavior', () => {
    it('handles function errors and retries with jitter', async () => {
      const testLogger = createTestLogger();
      let attempts = 0;
      const delays: number[] = [];

      function flakyFunction(): number {
        attempts++;
        if (attempts < 3) {
          const error = new Error('Temporary failure') as Error & {
            status: number;
          };
          error.status = 429;
          throw error;
        }
        return 42;
      }

      // Mock setTimeout to capture delays
      vi.spyOn(globalThis, 'setTimeout').mockImplementation(
        (callback: () => void, ms?: number): NodeJS.Timeout => {
          if (ms) delays.push(ms);
          callback();
          return {} as NodeJS.Timeout;
        },
      );

      const wrapped = wrapFunction(flakyFunction, {
        logger: testLogger.logger,
        name: 'flakyFunction',
        retry: {
          attempts: 3,
          delay: 100,
          jitter: true,
          maxDelay: 1000,
        },
      });

      const result = await wrapped();
      expect(result).toBe(42);
      expect(attempts).toBe(3);
      expect(delays.length).toBe(2); // Two retries
      for (const delay of delays) {
        expect(delay).toBeGreaterThan(50); // With jitter, delay should be > 50% of base
        expect(delay).toBeLessThan(1000); // Should respect maxDelay
      }

      vi.restoreAllMocks();
    });

    it('does not retry non-retryable errors', async () => {
      const testLogger = createTestLogger();
      let attempts = 0;

      function failingFunction(): never {
        attempts++;
        const error = new Error('Fatal error') as Error & { status: number };
        error.status = 401;
        throw error;
      }

      const wrapped = wrapFunction(failingFunction, {
        logger: testLogger.logger,
        retry: { attempts: 3, delay: 10 },
      });

      await expect(wrapped()).rejects.toThrow('Fatal error');
      expect(attempts).toBe(1);
    });
  });
});
