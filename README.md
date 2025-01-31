> Make simple server-side logic and reduce boilerplate code.

[![npm downloads](https://img.shields.io/npm/dm/exlite.svg)](https://www.npmjs.com/package/exlite)
[![npm version](https://img.shields.io/npm/v/exlite.svg)](https://www.npmjs.com/package/exlite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview 🌟

`exlite` is a lightweight utility library designed specifically for Express.js, helping developers simplify server-side logic and reduce boilerplate code. It provides ready-to-use features like error handling, HTTP status utilities, and standardized API responses, enabling you to write cleaner, more maintainable code effortlessly.

## Table of Contents 📚

- [Features](#features-)
- [Installation](#installation-)
- [Motivation](#motivation-)
- [Quick Start](#quick-start-)
- [Error Handler Middleware: `globalErrorHandler`](#error-handler-middleware-globalerrorhandler-)
- [`asyncHandler`: Simplifying Controllers](#asynchandler-simplifying-controllers-️)
- [Standardized JSON Responses with ApiRes](#standardized-json-responses-with-apires-)
- [HttpError](#httperror-)
- [HttpStatus](#httpstatus-)
- [Class-Based Controllers with `proxyWrapper`](#class-based-controllers-with-proxywrapper-️)
- [Conclusion](#conclusion-)
- [Contributing](#contributing-)
- [Author](#author-)
- [License](#license-)

## Features ✨

- 🚦 Simplifies route and controller management with pre-built helpers.
- 🛡️ Integrated error handling across all routes and middleware.
- ✨ Easy-to-use `asyncHandler` for automatically catching and handling errors.
- 📜 Customizable response formatting for consistent API outputs.
- ⚡ Flexible error handling with custom error classes.
- 🎨 Efficient management of HTTP status codes and responses.

### Installation 📥

```bash
npm install --save exlite
```

### Motivation 💡

Building APIs often involves repetitive tasks like handling errors, managing HTTP status codes, or structuring JSON responses. exlite was created to eliminate this hassle, allowing developers to focus on writing business logic instead of reinventing common solutions. Whether you're a beginner or an experienced developer, exlite streamlines your workflow and ensures your Express applications are consistent and reliable.

### Quick Start ⚡

Here’s a minimal setup to get you started with exlite:

```typescript
import express from 'express';
import {asyncHandler, globalErrorHandler} from 'exlite';

const app = express();

// Middleware
app.use(express.json());

// Example route using asyncHandler
const getUser = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  return ApiRes.ok(user); // Send user data in the response
});

// Routers
app.get('/user/:id', getUser);

// Error handling middleware
app.use(
  globalErrorHandler({
    isDev: process.env.NODE_ENV === 'development',
    write: error => console.error(error),
  }),
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Error Handler Middleware: `globalErrorHandler` 🚨

The globalErrorHandler middleware manages HttpErrors and unknown errors, returning appropriate JSON responses.

**Usage:**

```typescript
import {errorHandler} from 'exlite';

// Basic usage with default options
app.use(
  globalErrorHandler({
    isDev: process.env.NODE_ENV === 'development',
  }),
);

// Custom usage with logging in production mode
app.use(
  globalErrorHandler({
    isDev: process.env.NODE_ENV === 'development',
    write: error => console.error(error),
  }),
);
```

**Signature:**  
`globalErrorHandler({ isDev: boolean, write?: (err) => void }): ErrorRequestHandler`

**Options:**

- **isDev**: Enables detailed error messages in development mode (default: true).
- **write**: Optional callback for logging or handling errors.

## `asyncHandler`: Simplifying Controllers 🛠️

The `asyncHandler` function in exlite eliminates repetitive `try-catch` blocks by managing error handling for both async and sync functions. It also integrates seamlessly with ApiRes for enhanced response handling and provides other handler features.

#### Simplifying Route Handlers

```typescript
import {asyncHandler, ApiRes} from 'exlite';

// Route without asyncHandler (traditional approach with try-catch)
app.get('/user/:id', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    next(error); // Pass the error to the error-handling middleware
  }
});

// Route using asyncHandler (simplified with exlite)
app.get(
  '/user/:id',
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.params.id); // Fetch user from database
    return ApiRes.ok(user, 'User fetched successfully'); // Send success response using ApiRes
  }),
);
```

#### Advanced Example: Handling Cookies and Headers

```typescript
const login = asyncHandler(async (req, res) => {
  const {email, password} = req.body;
  const user = await loginUser(email, password);

  // Manually setting headers
  res.setHeader('X-Custom-Header', 'SomeHeaderValue');

  // Set multiple cookies for authentication
  res.cookie('access-token', user.accessToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS
    maxAge: 3600000, // 1 hour
  });

  res.cookie('refresh-token', user.refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 3600000, // 1 week
  });

  // API response with token and user info
  return ApiRes.ok(user, 'Logged in successfully');
});
```

#### Minimal Examples

- **Simple Response:**

```typescript
const getHome = asyncHandler(() => 'Hello World!');
```

- **Custom JSON Response:**

```typescript
const getHome = asyncHandler(() => ({message: 'Hello World!'}));
```

- **Without ApiRes:**

```typescript
const login = asyncHandler(async (req, res) => {
  const user = await getUserById(req.params.id);
  // Manually setting headers
  res.setHeader('X-Custom-Header', 'SomeHeaderValue');
  // Setting cookies
  res.cookie('access-token', user.accessToken, {
    httpOnly: true,
    secure: true, // Set to true in production with HTTPS
    maxAge: 3600000, // 1 hour
  });
  // Sending a custom JSON response
  return res.status(200).json({
    status: 'success',
    message: 'User fetched successfully',
    data: user,
  });
});
```

#### Middleware Example: Role-Based Access Control

```typescript
import {Role} from './constants';
import {asyncHandler, ForbiddenError} from 'exlite';

/** Permission middleware */
export const permission = (...roles: Role[]) =>
  asyncHandler(async (req, _, next) => {
    const {user} = req;

    if (!roles.includes(user?.role))
      throw new ForbiddenError(`Access denied for ${req.originalUrl}`);

    next();
  });

export const onlyAdmin = permission(Role.ADMIN);
export const adminOrUser = permission(Role.ADMIN, Role.USER);
```

**Benefits:**

- Eliminates boilerplate try-catch logic.
- Simplifies response handling with `ApiRes`.
- Works seamlessly for both `request handlers` and `middleware`.

## Standardized JSON Responses with ApiRes 📊

ApiRes provides a consistent structure for API responses. It includes several static methods that handle common response patterns, such as `ok`, `created`, and `paginated`.

**Usage:**

```typescript
import {ApiRes} from 'exlite';

// With paginated
const list = asyncHandler(async req => {
  const {data, meta} = await getUsers(req.query);
  return ApiRes.paginated(data, meta, 'Get users list successfully');
});

// With created
const create = asyncHandler(async req => {
  const user = await createUser(req.body);
  return ApiRes.created(user, 'User created successfully');
});

// With ok
const get = asyncHandler(async req => {
  const user = await getUser(req.params);
  return ApiRes.ok(user, 'Get user successfully');
});

// Routers
app.route('/').get(list).post(create);
app.route('/:id').get(get);
```

**ApiRes Methods**

- `ok(result, message)`: Returns a success response (HTTP 200).
- `created(result, message)`: Returns a resource creation response (HTTP 201).
- `paginated(data, meta, message)`: Returns a success response (HTTP 200).

## HttpError ❌

The HttpError class standardizes error handling by extending the native Error class. It’s used to throw HTTP-related errors, which are then caught by the httpErrorHandler middleware.

**Usage:**

```typescript
import {HttpError, HttpStatus} from 'exlite';

// Example without asyncHandler
app.get('*', () => {
  throw new HttpError('Not Found', HttpStatus.NOT_FOUND); // Throw a 404 error
});

// Example with asyncHandler
app.post(
  '/example',
  asyncHandler(req => {
    if (!req.body.name) throw new BadRequestError('Name is required');
  }),
);
```

**HttpError(msg, status, details)**

- `msg`: This parameter accepts an error message, which can be a single string or an array of strings (required).
- `status`: The status code of the error, mirroring statusCode for general compatibility (default is 500).
- `detail`: This is an optional plain object that contains additional information about the error.

```typescript
const err = new HttpError('Validation error.', 400, {
  username: 'Username is required',
  password: 'Password is required',
});
```

#### Provide common HTTP errors.

- BadRequestError
- UnAuthorizedError
- NotFoundError
- ConflictError
- ForbiddenError
- PaymentRequiredError
- NotImplementedError
- InternalServerError

_Note: If only a status code is provided, the HttpError class will automatically generate an appropriate error name based on that status code._

#### **isHttpError(value) Static Method**

The `HttpError.isHttpError(value)` method is a useful way to determine if a specific value is an instance of the HttpError class. It will return true if the value is derived from the HttpError constructor, allowing you to easily identify HTTP-related errors in your application.

```typescript
// If it is an HttpError, send a JSON response with the error details
if (HttpError.isHttpError(err))
  return res.status(err.status).json(err.toJson());
else {
  // If it's not an HttpError, pass it to the next middleware for further handling
  next(err);
}
```

#### Error Properties

When you create an instance of HttpError, it comes with several useful properties that help provide context about the error:

- **status**: The HTTP status code associated with the error (e.g., 404 for Not Found, 500 for Internal Server Error).
- **message**: A brief description of the error, which is useful for debugging and logging.
- **stack**: The stack trace of the error, available when the application is in development mode. This helps identify where the error occurred in your code.
- **details**: An optional property that can hold additional information about the error, such as validation issues or other relevant data.

#### Custom ErrorHandler Middleware

```typescript
export const errorHandler: ErrorRequestHandler = (err, req, res, next): any => {
  // Handle known HttpError instances
  if (HttpError.isHttpError(err))
    return res.status(err.status).json(err.toJson());

  // Log unknown errors
  console.error(err);

  // Create an InternalServerError for unknown errors
  const error = new InternalServerError(
    config.dev ? err.message : 'Something went wrong',
    config.dev ? err.stack : null,
  );
  return res.status(error.status).json(error.toJson());
};
```

#### toJson Static Method

The `toJson` method is a static function that allows you to convert an HttpError instance into a structured JSON format. This is particularly useful for standardizing error responses sent to clients. When you call `toJson`, it returns an object containing the following properties:

- **status**: The HTTP status code of the error.
- **message**: A human-readable message describing the error.
- **details** (if applicable): Any additional information that provides context about the error.

This method ensures that your API consistently responds to errors in a uniform way, making it easier for clients to understand and handle error responses.

## HttpStatus ✅

The HttpStatus provides readable constants for standard HTTP status codes (2xx, 3xx, 4xx, 5xx), improving code clarity and consistency.

**Usage:**

```typescript
import {HttpStatus} from 'exlite';

// Example: Basic usage in a route
app.get('/status-example', (req, res) => {
  res.status(HttpStatus.OK).json({message: 'All good!'});
});

// Example: Custom error handling middleware
app.use((req, res) => {
  res.status(HttpStatus.NOT_FOUND).json({
    error: 'Resource not found',
  });
});

// Example: Response with a 201 Created status
app.post('/create', (req, res) => {
  const resource = createResource(req.body);
  res.status(HttpStatus.CREATED).json({
    message: 'Resource created successfully',
    data: resource,
  });
});
```

#### HttpStatus.NAMES of HTTP Status Code Name

The NAMES object provides a simple lookup for the descriptive names of HTTP status codes:

```typescript
const statusName = HttpStatus.NAMES.$200; // 'OK'
```

**Benefits:**

- Improves code readability and maintainability.
- Reduces dependency on remembering or looking up numeric codes.
- Ensures consistent use of status codes throughout your application.

**Below is a list of commonly used HTTP status codes, their respective constants, and descriptions for easier reference:**

#### **2xx: Success**

- **HttpStatus.OK**: 200 — Request succeeded.
- **HttpStatus.CREATED**: 201 — Resource created.
- **HttpStatus.ACCEPTED**: 202 — Request accepted for processing.
- **HttpStatus.NON_AUTHORITATIVE_INFORMATION**: 203 — Non-authoritative information.
- **HttpStatus.NO_CONTENT**: 204 — No content to send.
- **HttpStatus.RESET_CONTENT**: 205 — Content reset.
- **HttpStatus.PARTIAL_CONTENT**: 206 — Partial content delivered.

#### **3xx: Redirection**

- **HttpStatus.AMBIGUOUS**: 300 — Multiple choices available.
- **HttpStatus.MOVED_PERMANENTLY**: 301 — Resource moved permanently.
- **HttpStatus.FOUND**: 302 — Resource found at another URI.
- **HttpStatus.SEE_OTHER**: 303 — See other resource.
- **HttpStatus.NOT_MODIFIED**: 304 — Resource not modified.
- **HttpStatus.TEMPORARY_REDIRECT**: 307 — Temporary redirect.
- **HttpStatus.PERMANENT_REDIRECT**: 308 — Permanent redirect.

#### **4xx: Client Error**

- **HttpStatus.BAD_REQUEST**: 400 — Bad request.
- **HttpStatus.UNAUTHORIZED**: 401 — Authentication required.
- **HttpStatus.PAYMENT_REQUIRED**: 402 — Payment required.
- **HttpStatus.FORBIDDEN**: 403 — Access forbidden.
- **HttpStatus.NOT_FOUND**: 404 — Resource not found.
- **HttpStatus.METHOD_NOT_ALLOWED**: 405 — Method not allowed.
- **HttpStatus.NOT_ACCEPTABLE**: 406 — Not acceptable content.
- **HttpStatus.PROXY_AUTHENTICATION_REQUIRED**: 407 — Proxy authentication required.
- **HttpStatus.REQUEST_TIMEOUT**: 408 — Request timed out.
- **HttpStatus.CONFLICT**: 409 — Conflict with current state.
- **HttpStatus.GONE**: 410 — Resource gone.
- **HttpStatus.LENGTH_REQUIRED**: 411 — Length required.
- **HttpStatus.PRECONDITION_FAILED**: 412 — Precondition failed.
- **HttpStatus.PAYLOAD_TOO_LARGE**: 413 — Payload too large.
- **HttpStatus.URI_TOO_LONG**: 414 — URI too long.
- **HttpStatus.UNSUPPORTED_MEDIA_TYPE**: 415 — Unsupported media type.
- **HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE**: 416 — Requested range not satisfiable.
- **HttpStatus.EXPECTATION_FAILED**: 417 — Expectation failed.
- **HttpStatus.I_AM_A_TEAPOT**: 418 — I'm a teapot (a joke HTTP status).
- **HttpStatus.MISDIRECTED_REQUEST**: 421 — Misdirected request.
- **HttpStatus.UNPROCESSABLE_ENTITY**: 422 — Unprocessable entity.
- **HttpStatus.FAILED_DEPENDENCY**: 424 — Failed dependency.
- **HttpStatus.PRECONDITION_REQUIRED**: 428 — Precondition required.
- **HttpStatus.TOO_MANY_REQUESTS**: 429 — Too many requests.

#### **5xx: Server Error**

- **HttpStatus.INTERNAL_SERVER_ERROR**: 500 — Internal server error.
- **HttpStatus.NOT_IMPLEMENTED**: 501 — Not implemented.
- **HttpStatus.BAD_GATEWAY**: 502 — Bad gateway.
- **HttpStatus.SERVICE_UNAVAILABLE**: 503 — Service unavailable.
- **HttpStatus.GATEWAY_TIMEOUT**: 504 — Gateway timeout.
- **HttpStatus.HTTP_VERSION_NOT_SUPPORTED**: 505 — HTTP version not supported.
- **HttpStatus.VARIANT_ALSO_NEGOTIATES**: 506 — Variant also negotiates.
- **HttpStatus.INSUFFICIENT_STORAGE**: 507 — Insufficient storage.
- **HttpStatus.LOOP_DETECTED**: 508 — Loop detected.
- **HttpStatus.BANDWIDTH_LIMIT_EXCEEDED**: 509 — Bandwidth limit exceeded.
- **HttpStatus.NOT_EXTENDED**: 510 — Not extended.
- **HttpStatus.NETWORK_AUTHENTICATION_REQUIRED**: 511 — Network authentication required.

## Class-Based Controllers with `proxyWrapper` 🏗️

`exlite` provides the utility `proxyWrapper` to simplify working with class-based controllers in Express.

Here’s a step-by-step guide on how to implement class-based controllers with `exlite`:

**1. Define Your Controller Class**

```typescript
import {Request} from 'express';

class ExampleController {
  constructor(private message: string) {}

  async getData(req: Request) {
    // Your logic here
    return ApiRes.ok({}, this.message);
  }
}
```

**2. Set Up Your Routes Using `proxyWrapper`**

```typescript
// example-routes.ts
import {Router} from 'express';
import {proxyWrapper} from 'exlite';

const exampleRoutes = (): Router => {
  const router = Router();

  // Create a proxied instance of ExampleController
  const example = proxyWrapper(ExampleController, 'Hello World');

  // Configure routes
  return router.post('/data', example.getData);
};
```

**`proxyWrapper(clsOrInstance, ...args)`**

- **Parameters**:

  - `clsOrInstance`: This parameter accepts either a class constructor or an instance of a class.
  - `args`: This parameter accepts the arguments for the class constructor (if `clsOrInstance` is a constructor).

- **Returns**: A proxied instance where all methods are wrapped with `asyncHandler`.

#### How It Works

- Instantiates the specified class if a constructor is provided.
- Wraps all its methods with `asyncHandler`, allowing for automatic handling of asynchronous operations.
- Prevents method/property overrides for safety.

### Using Dependency Injection Libraries

you want to use a dependency injection library like `tsyringe` or `typedi`.

#### Example with `tsyringe`

```typescript
import {Request} from 'express';
import {container, singleton} from 'tsyringe';

@singleton()
class ExampleController {
  constructor(private message: string) {}

  async getData(req: Request) {
    return ApiRes.ok({}, this.message);
  }
}

// Set up routes
const exampleRoutes = (): Router => {
  const router = Router();

  // Create a proxied instance of ExampleController
  const example = proxyWrapper(container.resolve(ExampleController));

  // Configure routes
  return router.post('/data', example.getData);
};
```

#### Example with `typedi`

```typescript
import {Request} from 'express';
import {Service, Container} from 'typedi';

@Service()
class ExampleController {
  constructor(private message: string) {}

  async getData(req: Request) {
    return ApiRes.ok({}, this.message);
  }
}

// Set up routes
const exampleRoutes = (): Router => {
  const router = Router();

  // Create a proxied instance of ExampleController
  const example = proxyWrapper(Container.get(ExampleController));

  // Configure routes
  return router.post('/data', example.getData);
};
```

## Conclusion 🏁

exlite is a powerful tool designed to simplify and enhance Express.js applications by providing essential features out of the box. Whether you’re building a simple API or a complex web application, exlite helps you maintain clean and manageable code.

## Contributing 🤝

Contributions are highly appreciated! To contribute:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of your changes.

## Author 👤

- Created by **Aashish Panchal**.
- GitHub: [@aashishpanchal](https://github.com/aashishpanchal)

## License 📜

[MIT © Aashish Panchal](LICENSE)
