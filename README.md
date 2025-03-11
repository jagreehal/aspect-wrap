# 🎁 Aspect Wrap

> **TLDR:** Wrap functions and classes to automatically add logging, error handling, and retries with zero configuration.
>
> ```javascript
> import { wrapClass, wrapFunction } from 'aspect-wrap';
>
> // Add structured logging to any function
> const loggedFunction = wrapFunction(myFunction);
>
> // Add structured logging to all methods in a class
> const LoggedClass = wrapClass(MyClass);
> ```

Aspect Wrap is a streamlined, lightweight library designed to simplify aspect-oriented programming (AOP) without unnecessary complexity or ceremony.

By allowing you to elegantly augment existing functions with additional behaviour such as logging, error handling, and retires.

With Aspect Wrap you can maintain a clear separation between core business logic and cross-cutting concerns. This approach not only enhances code readability but also improves maintainability and scalability.

Aspect Wrap is designed to work seamlessly in both Node.js and browser environments, making it a versatile choice for any JavaScript or TypeScript project.

## Why Use Aspect Wrap?

✅ **Zero Configuration** - Works out of the box with smart defaults

✅ **Built-in Structured Logging** - No logger? No problem! Get structured logs automatically

✅ **Clean Code** - Keep your business logic free from cross-cutting concerns

✅ **Powerful When Needed** - Simple API with advanced features when you need them

✅ **Framework Agnostic** - Works with any JavaScript or TypeScript codebase

✅ **Universal** - Works in both Node.js and browser environments

```javascript
// Before: Business logic mixed with logging
function getUserData(id) {
  console.log(`Getting user data for ${id}`);
  try {
    // ...business logic...
    console.log(`Successfully retrieved user data`);
    return userData;
  } catch (error) {
    console.error(`Error getting user data: ${error.message}`);
    throw error;
  }
}

// After: Clean business logic with automatic logging
function getUserData(id) {
  // ...business logic...
  return userData;
}

// Just wrap it - that's it!
const loggedGetUserData = wrapFunction(getUserData);
```

## Table of Contents

- [🎁 Aspect Wrap](#-aspect-wrap)
  - [Why Use Aspect Wrap?](#why-use-aspect-wrap)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
    - [Browser Usage](#browser-usage)
  - [Usage](#usage)
    - [Before Aspect Wrap: Code with Mixed Concerns](#before-aspect-wrap-code-with-mixed-concerns)
    - [After Aspect Wrap: Clean Separation of Concerns](#after-aspect-wrap-clean-separation-of-concerns)
      - [Using with Pino Logger](#using-with-pino-logger)
      - [Customising the Behaviour](#customising-the-behaviour)
    - [Advanced Usage with Error Handling](#advanced-usage-with-error-handling)
    - [Wrapping Classes and Methods](#wrapping-classes-and-methods)
    - [Implementing Retry Logic](#implementing-retry-logic)
  - [Using Aspect Wrap with Pino for Logging](#using-aspect-wrap-with-pino-for-logging)
    - [Installing Pino](#installing-pino)
    - [Simple Logging with Pino](#simple-logging-with-pino)
    - [Enhanced Logging with Pino's Redaction](#enhanced-logging-with-pinos-redaction)
  - [API Reference](#api-reference)
    - [Core Functions](#core-functions)
      - [`wrapFunction(targetFunction, options)`](#wrapfunctiontargetfunction-options)
      - [`wrapClass(TargetClass, options)`](#wrapclasstargetclass-options)
    - [Retry Configuration](#retry-configuration)
  - [Contributing](#contributing)
  - [Licence](#licence)

## Installation

Install Aspect Wrap using a package manager:

```bash
npm install aspect-wrap
pnpm add aspect-wrap
bun add aspect-wrap
yarn add aspect-wrap
```

### Browser Usage

Aspect Wrap works in browser environments too. You can use it with bundlers like webpack, Rollup, or Vite:

```javascript
// Using ES modules
import { wrapClass, wrapFunction } from 'aspect-wrap';
```

Or directly in the browser via CDN:

```html
<!-- ESM version -->
<script type="module">
  import {
    wrapClass,
    wrapFunction,
  } from 'https://unpkg.com/aspect-wrap/dist/index.js';
</script>

<!-- UMD version (global variable) -->
<script src="https://unpkg.com/aspect-wrap/dist/index.cjs"></script>
<script>
  const { wrapClass, wrapFunction } = aspectWrap;
</script>
```

Note: When using via CDN, make sure to specify the version for production use:

```html
https://unpkg.com/aspect-wrap@1.0.2/dist/index.js
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

With Aspect Wrap, you can separate your business logic from cross-cutting concerns with minimal effort:

```javascript
import { wrapFunction } from 'aspect-wrap';

// Pure business logic - no logging concerns
function greet(name) {
  return `Hello, ${name}!`;
}

function calculateSum(a, b) {
  return a + b;
}

// Super simple usage - no logger needed!
const loggedGreet = wrapFunction(greet);
const loggedCalculateSum = wrapFunction(calculateSum);

// Use exactly as before - no change to your calling code
loggedGreet('Alice');
loggedCalculateSum(5, 7);

// Automatically logs structured output:
// {"functionName":"greet","args":["Alice"],"msg":"Function called","timestamp":"2023-06-15T10:30:45.123Z"}
// {"functionName":"greet","result":"Hello, Alice!","msg":"Function completed","timestamp":"2023-06-15T10:30:45.125Z"}
// {"functionName":"calculateSum","args":[5,7],"msg":"Function called","timestamp":"2023-06-15T10:30:45.126Z"}
// {"functionName":"calculateSum","result":12,"msg":"Function completed","timestamp":"2023-06-15T10:30:45.127Z"}
```

#### Using with Pino Logger

For more advanced logging, you can easily pass a Pino logger:

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

// Super simple usage - just pass your function and a logger
const loggedGreet = wrapFunction(greet, { logger });
const loggedCalculateSum = wrapFunction(calculateSum, { logger });

// Use exactly as before
loggedGreet('Alice');
loggedCalculateSum(5, 7);

// Logs will include:
// {"level":30,"functionName":"greet","args":["Alice"],"msg":"Function called","time":...}
// {"level":30,"functionName":"greet","result":"Hello, Alice!","msg":"Function completed","time":...}
// {"level":30,"functionName":"calculateSum","args":[5,7],"msg":"Function called","time":...}
// {"level":30,"functionName":"calculateSum","result":12,"msg":"Function completed","time":...}
```

#### Customising the Behaviour

You can customise the behaviour with additional options:

```javascript
// More customised usage with before, after, and error handlers
const customLoggedGreet = wrapFunction(greet, {
  name: 'greet',
  logger,
  before: (name, args) => logger.info({ args }, 'Calling greet'),
  after: (name, result) => logger.info({ result }, 'Greet returned'),
  onError: (name, error) => logger.error({ error }, 'Error in greet'),
});

const customLoggedCalculateSum = wrapFunction(calculateSum, {
  name: 'calculateSum',
  logger,
  before: (name, args) => logger.info({ args }, 'Calculating sum'),
  after: (name, result) => logger.info({ result }, 'Sum result'),
  onError: (name, error) => logger.error({ error }, 'Error calculating sum'),
});

// Use exactly as before
customLoggedGreet('Alice');
customLoggedCalculateSum(5, 7);
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
    attempts: 3, // Maximum number of attempts (default: 3)
    delay: 100, // Initial delay in ms (default: 100)
    factor: 2, // Backoff multiplier (default: 2)
    maxDelay: 30000, // Maximum delay between retries (default: 30000)
    jitter: true, // Whether to add randomness to delay (default: true)
    shouldRetry: (error) => error.status === 429, // Function to determine if an error should trigger a retry
    // By default retries on HTTP 429 and 503 status codes
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

Aspect Wrap works perfectly with [Pino](https://github.com/pinojs/pino), a super-fast logging library for Node.js.

### Installing Pino

First, install Pino alongside Aspect Wrap:

```bash
npm install aspect-wrap pino
```

### Simple Logging with Pino

The simplest way to use Aspect Wrap with Pino is just passing your logger:

```javascript
import { wrapFunction } from 'aspect-wrap';
import pino from 'pino';

// Create a Pino logger
const logger = pino();

// Your normal function
function sayHello(name) {
  return `Hello, ${name}!`;
}

// Just wrap it with the logger - that's it!
const loggedHello = wrapFunction(sayHello, { logger });

// Use it like normal
loggedHello('World');

// Automatically logs:
// {"level":30,"functionName":"sayHello","args":["World"],"msg":"Function called",...}
// {"level":30,"functionName":"sayHello","result":"Hello, World!","msg":"Function completed",...}
```

### Enhanced Logging with Pino's Redaction

For sensitive data, Pino's redaction feature works great with Aspect Wrap:

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

// Just wrap it with the logger - redaction happens automatically
const securePaymentProcessor = wrapFunction(processPayment, { logger });

// Process a payment with sensitive data
securePaymentProcessor(
  { id: 'user123', name: 'Alice' },
  { number: '4111-1111-1111-1111', cvv: '123' },
  99.99,
);

// Logs with credit card details automatically redacted:
// {"level":30,"functionName":"processPayment","args":[{"id":"user123","name":"Alice"},{"number":"[REDACTED]","cvv":"[REDACTED]"},99.99],"msg":"Function called",...}
// {"level":30,"functionName":"processPayment","result":{"success":true,"transactionId":"tx_123456"},"msg":"Function completed",...}
```

This approach gives you:

1. Super simple setup - just pass your logger
2. Automatic logging of inputs and outputs
3. Automatic redaction of sensitive data
4. Clean business logic with no logging code mixed in

## API Reference

### Core Functions

All functions and features of Aspect Wrap are compatible with both Node.js and browser environments.

#### `wrapFunction(targetFunction, options)`

Wraps a function with additional behaviour.

- **`targetFunction`** _(Function)_: The original function you want to wrap.
- **`options`** _(Object)_: Configuration options:
  - **`name`** _(string)_ _(optional)_: Name for the function (defaults to fn.name or 'anonymous').
  - **`before`** _(Function)_ _(optional)_: Executed before the target function. Receives function name, arguments array, and context.
  - **`after`** _(Function)_ _(optional)_: Executed after the target function. Receives function name, result, and context.
  - **`onError`** _(Function)_ _(optional)_: Executed if the target function throws an error. Receives function name, error object, and context.
  - **`finally`** _(Function)_ _(optional)_: Executed after both success and error cases. Receives function name and context.
  - **`logger`** _(Logger)_ _(optional)_: Custom logger to use. If not provided, a built-in structured console logger is used by default.
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
  - **`logger`** _(Logger)_ _(optional)_: Custom logger to use. If not provided, a built-in structured console logger is used by default.
  - **`retry`** _(Object)_ _(optional)_: Retry configuration (see below).

### Retry Configuration

The retry feature allows automatic retrying of failed operations with configurable backoff strategies.

```javascript
{
  retry: {
    attempts: 3,                                  // Maximum number of attempts (default: 3)
    delay: 100,                                   // Initial delay in ms (default: 100)
    factor: 2,                                    // Backoff multiplier (default: 2)
    maxDelay: 30000,                              // Maximum delay between retries (default: 30000)
    jitter: true,                                 // Whether to add randomness to delay (default: true)
    shouldRetry: (error) => error.status === 429, // Function to determine if an error should trigger a retry
                                                  // By default retries on HTTP 429 and 503 status codes
  }
}
```

## Contributing

We welcome contributions! Please open an issue or submit a pull request on GitHub.

## Licence

Aspect Wrap is licensed under the MIT Licence. See [LICENCE](LICENCE) for details.
