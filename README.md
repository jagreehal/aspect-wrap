# Aspect Wrap

Aspect Wrap is a streamlined, lightweight library designed to simplify aspect-oriented programming (AOP) without the encumbrance of unnecessary complexity or ceremony.

By allowing you to elegantly augment existing functions with additional behaviour—such as logging, error handling, and more.

With Aspect Wrap you can maintain a clear separation between core business logic and cross-cutting concerns. This approach not only enhances code readability but also improves maintainability and scalability.

## Table of Contents

- [Aspect Wrap](#aspect-wrap)
  - [Table of Contents](#table-of-contents)
  - [Why Aspect Wrap?](#why-aspect-wrap)
    - [Key Benefits](#key-benefits)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Before Aspect Wrap: Code with Mixed Concerns](#before-aspect-wrap-code-with-mixed-concerns)
    - [After Aspect Wrap: Clean Separation of Concerns](#after-aspect-wrap-clean-separation-of-concerns)
    - [Advanced Usage with Error Handling](#advanced-usage-with-error-handling)
    - [Wrapping Classes and Methods](#wrapping-classes-and-methods)
    - [Implementing Retry Logic](#implementing-retry-logic)
  - [Using Aspect Wrap with Pino for Logging](#using-aspect-wrap-with-pino-for-logging)
    - [Installing Pino](#installing-pino)
    - [Enhanced Logging with Pino's Redaction](#enhanced-logging-with-pinos-redaction)
  - [API Reference](#api-reference)
    - [Core Functions](#core-functions)
      - [`wrapFunction(targetFunction, options)`](#wrapfunctiontargetfunction-options)
      - [`wrapClass(TargetClass, options)`](#wrapclasstargetclass-options)
    - [Retry Configuration](#retry-configuration)
    - [Performance Monitoring](#performance-monitoring)
  - [Contributing](#contributing)
  - [Licence](#licence)

## Why Aspect Wrap?

Aspect-oriented programming helps you separate cross-cutting concerns (like logging, security, or transaction management) from your core business logic.

Aspect Wrap provides a clean, simple, and efficient way to achieve this separation, making your codebase easier to maintain, test, and scale.

### Key Benefits

- **Clean Separation**: Keep your business logic free from repetitive cross-cutting concerns.
- **Easy Integration**: Minimal setup and intuitive API.
- **Highly Customisable**: Easily extendable to fit your specific needs.
- **Improved Developer Experience**: Write cleaner, more maintainable code.
- **Smart Defaults**: Comes with intelligent defaults like automatic retries with exponential backoff for network requests.
- **Error Resilience**: Built-in retry mechanisms automatically handle transient failures, particularly for HTTP 429 (Too Many Requests) and 503 (Service Unavailable) responses.

## Installation

Install Aspect Wrap using a package manager:

```bash
npm install aspect-wrap
pnpm add aspect-wrap
bun add aspect-wrap
yarn add aspect-wrap
```

## Usage

### Before Aspect Wrap: Code with Mixed Concerns

Here's how code typically looks when mixing business logic with cross-cutting concerns like logging:

```javascript
import pino from 'pino';

const logger = pino({ level: 'info' });

// Function with mixed concerns - business logic and logging
function greet(name) {
  logger.info(`Calling greet with: ${name}`);
  try {
    const result = `Hello, ${name}!`;
    logger.info(`Greet returned: ${result}`);
    return result;
  } catch (error) {
    logger.error(`Error in greet: ${error.message}`);
    throw error;
  }
}

// Another function with the same pattern
function calculateSum(a, b) {
  logger.info(`Calculating sum of ${a} and ${b}`);
  try {
    const result = a + b;
    logger.info(`Sum result: ${result}`);
    return result;
  } catch (error) {
    logger.error(`Error calculating sum: ${error.message}`);
    throw error;
  }
}

greet('Alice');
calculateSum(5, 7);
```

### After Aspect Wrap: Clean Separation of Concerns

With Aspect Wrap, you can separate your business logic from cross-cutting concerns:

```javascript
import { wrapFunction } from 'aspect-wrap';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Pure business logic - no logging concerns
function greet(name) {
  return `Hello, ${name}!`;
}

function calculateSum(a, b) {
  return a + b;
}

// Apply logging aspect separately
const loggedGreet = wrapFunction(greet, {
  name: 'greet',
  logger,
  before: (name, args) => logger.info({ args }, 'Calling greet'),
  after: (name, result) => logger.info({ result }, 'Greet returned'),
  onError: (name, error) => logger.error({ error }, 'Error in greet'),
});

const loggedCalculateSum = wrapFunction(calculateSum, {
  name: 'calculateSum',
  logger,
  before: (name, args) => logger.info({ args }, 'Calculating sum'),
  after: (name, result) => logger.info({ result }, 'Sum result'),
  onError: (name, error) => logger.error({ error }, 'Error calculating sum'),
});

loggedGreet('Alice').then(console.log);
loggedCalculateSum(5, 7).then(console.log);
```

### Advanced Usage with Error Handling

Aspect Wrap also simplifies error handling:

```javascript
import { wrapFunction } from 'aspect-wrap';

function riskyOperation() {
  throw new Error('Something went wrong!');
}

const safeOperation = wrapFunction(riskyOperation, {
  name: 'riskyOperation',
  onError: (name, error) => console.error('Caught an error:', error.message),
});

safeOperation().catch(() => {
  // Error is already logged by the wrapper
});
// Output:
// Caught an error: Something went wrong!
```

### Wrapping Classes and Methods

Aspect Wrap can also be applied to class methods, allowing you to add cross-cutting concerns to object-oriented code:

```javascript
import { wrapClass, wrapFunction } from 'aspect-wrap';
import pino from 'pino';

const logger = pino({ level: 'info' });

// Original class with pure business logic
class UserService {
  constructor(database) {
    this.database = database;
  }

  async getUserById(id) {
    return this.database.findUser(id);
  }

  async updateUser(id, data) {
    return this.database.updateUser(id, data);
  }
}

// Method 1: Wrap individual methods
const userService = new UserService(database);
userService.getUserById = wrapFunction(
  userService.getUserById.bind(userService),
  {
    name: 'getUserById',
    logger,
    before: (name, args) => logger.info({ userId: args[0] }, 'Getting user'),
    after: (name, result) => logger.info({ user: result }, 'User retrieved'),
    onError: (name, error) => logger.error({ error }, 'Error getting user'),
  },
);

// Method 2: Wrap the entire class
const LoggedUserService = wrapClass(UserService, {
  methodFilter: ['getUserById', 'updateUser'],
  logger,
  before: (methodName, args) =>
    logger.info({ method: methodName, args }, 'Method called'),
  after: (methodName, result) =>
    logger.info({ method: methodName, result }, 'Method completed'),
  onError: (methodName, error) =>
    logger.error({ method: methodName, error }, 'Method failed'),
});

const loggedUserService = new LoggedUserService(database);
await loggedUserService.getUserById('user123');
// Logs:
// {"level":30,"method":"getUserById","args":["user123"],"msg":"Method called","time":...}
// {"level":30,"method":"getUserById","result":{...},"msg":"Method completed","time":...}
```

### Implementing Retry Logic

One of Aspect Wrap's most powerful features is its ability to implement retry logic without cluttering your business code:

```javascript
import { wrapFunction } from 'aspect-wrap';

// A function that might fail (e.g., network request)
async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(`Failed to fetch: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

// Without Aspect Wrap - retry logic mixed with business logic
async function fetchDataWithRetry(url, maxRetries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchData(url);
    } catch (error) {
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      lastError = error;
      if (attempt < maxRetries) {
        const delay = 2 ** attempt * 100; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}

// With Aspect Wrap - clean separation of concerns
const fetchWithRetry = wrapFunction(fetchData, {
  name: 'fetchData',
  retry: {
    attempts: 3,
    delay: 100,
    factor: 2,
    maxDelay: 30000,
    jitter: true,
    shouldRetry: (error) => error.status === 429,
  },
});

// Usage
try {
  const data = await fetchWithRetry('https://api.example.com/data');
  console.log('Data fetched successfully:', data);
} catch (error) {
  console.error('All retry attempts failed:', error);
}
```

## Using Aspect Wrap with Pino for Logging

Aspect Wrap integrates seamlessly with [Pino](https://github.com/pinojs/pino), a fast and efficient logging library for Node.js, providing an ultimate developer experience.

### Installing Pino

First, install Pino:

```bash
npm install pino
```

### Enhanced Logging with Pino's Redaction

One of the key advantages of using Aspect Wrap with Pino is the ability to leverage Pino's powerful redaction functionality. This allows you to automatically redact sensitive information from logs, enhancing security without cluttering your business logic:

```javascript
import { wrapFunction } from 'aspect-wrap';
import pino from 'pino';

// Configure Pino with redaction for sensitive fields
const logger = pino({
  level: 'info',
  redact: {
    paths: ['password', 'creditCard', '*.secret'],
    censor: '[REDACTED]',
  },
});

function processPayment(user, creditCard, amount) {
  // Process payment logic
  return { success: true, transactionId: 'tx_123456' };
}

const securePaymentProcessor = wrapFunction(processPayment, {
  name: 'processPayment',
  logger,
  before: (name, args) =>
    logger.info(
      {
        user: args[0],
        creditCard: args[1],
        amount: args[2],
      },
      'Processing payment',
    ),
  after: (name, result) => logger.info({ result }, 'Payment processed'),
  onError: (name, error) => logger.error({ error }, 'Payment failed'),
});

securePaymentProcessor(
  { id: 'user123', name: 'Alice' },
  { number: '4111-1111-1111-1111', cvv: '123' },
  99.99,
).then(console.log);
// Logs with credit card details automatically redacted:
// {"level":30,"user":{"id":"user123","name":"Alice"},"creditCard":"[REDACTED]","amount":99.99,"msg":"Processing payment","time":...}
// {"level":30,"result":{"success":true,"transactionId":"tx_123456"},"msg":"Payment processed","time":...}
```

This approach provides the ultimate developer experience by:

1. Keeping your business logic clean and focused
2. Automatically handling sensitive data redaction
3. Providing comprehensive logging without code clutter
4. Making your code more maintainable and testable

## API Reference

### Core Functions

#### `wrapFunction(targetFunction, options)`

Wraps a function with additional behaviour.

- **`targetFunction`** _(Function)_: The original function you want to wrap.
- **`options`** _(Object)_: Configuration options:
  - **`name`** _(string)_ _(optional)_: Name for the function (defaults to fn.name or 'anonymous').
  - **`before`** _(Function)_ _(optional)_: Executed before the target function. Receives function name, arguments array, and context.
  - **`after`** _(Function)_ _(optional)_: Executed after the target function. Receives function name, result, and context.
  - **`onError`** _(Function)_ _(optional)_: Executed if the target function throws an error. Receives function name, error object, and context.
  - **`finally`** _(Function)_ _(optional)_: Executed after both success and error cases. Receives function name and context.
  - **`logger`** _(Logger)_ _(optional)_: Custom logger to use.
  - **`retry`** _(Object)_ _(optional)_: Retry configuration (see below).
  - **`preserveName`** _(boolean)_ _(optional)_: Whether to preserve the original function name (default: true).
  - **`preserveContext`** _(boolean)_ _(optional)_: Whether to bind the function to its original context (default: true).

#### `wrapClass(TargetClass, options)`

Wraps methods of a class with additional behaviour.

- **`TargetClass`** _(Class)_: The class whose methods you want to wrap.
- **`options`** _(Object)_: Configuration options:
  - **`methodFilter`** _(Array<string> | Function)_ _(optional)_: Array of method names to wrap or a filter function.
  - **`includeStatic`** _(boolean)_ _(optional)_: Whether to wrap static methods.
  - **`includeInherited`** _(boolean)_ _(optional)_: Whether to wrap inherited methods.
  - **`includePrivate`** _(boolean)_ _(optional)_: Whether to wrap private/protected methods (those starting with \_).
  - **`includeAccessors`** _(boolean)_ _(optional)_: Whether to wrap getters/setters.
  - **`before`** _(Function)_ _(optional)_: Executed before each method. Receives method name, arguments array, and context.
  - **`after`** _(Function)_ _(optional)_: Executed after each method. Receives method name, result, and context.
  - **`onError`** _(Function)_ _(optional)_: Executed if a method throws an error. Receives method name, error object, and context.
  - **`finally`** _(Function)_ _(optional)_: Executed after both success and error cases. Receives method name and context.
  - **`logger`** _(Logger)_ _(optional)_: Custom logger to use.
  - **`retry`** _(Object)_ _(optional)_: Retry configuration (see below).

### Retry Configuration

The retry feature allows automatic retrying of failed operations with configurable backoff strategies.

```javascript
{
  retry: {
    attempts: 3,                                  // Maximum number of attempts (default: 1)
    delay: 100,                                   // Initial delay in ms (default: 0)
    factor: 2,                                    // Backoff multiplier (default: 2)
    maxDelay: 30000,                              // Maximum delay between retries (default: 30000)
    jitter: true,                                 // Whether to add randomness to delay (default: true)
    shouldRetry: (error) => error.status === 429, // Function to determine if an error should trigger a retry
                                                  // By default retries on HTTP 429 and 503 status codes
  }
}
```

### Performance Monitoring

Aspect Wrap can be used to implement performance monitoring:

```javascript
const monitoredFunction = wrapFunction(myFunction, {
  name: 'myFunction',
  before: (name, args, context) => {
    context.startTime = performance.now();
  },
  after: (name, result, context) => {
    const duration = performance.now() - context.startTime;
    console.log(`Function executed in ${duration}ms`);
    return result;
  },
});
```

## Contributing

We welcome contributions! Please open an issue or submit a pull request on GitHub.

## Licence

Aspect Wrap is licensed under the MIT Licence. See [LICENCE](LICENCE) for details.
