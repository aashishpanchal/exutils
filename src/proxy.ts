import {join} from 'path';
import {match} from 'path-to-regexp';
import {asyncHandler} from './utils';
import express, {RequestHandler, Router} from 'express';
import type {
  Constructor,
  ProxyWrapper,
  ServeOptions,
  WrappedMethods,
} from './types';

// Overload signatures
export const proxyWrapper: ProxyWrapper = <T extends object>(
  clsOrInstance: Constructor<T> | T,
  ...args: ConstructorParameters<Constructor<T>> | []
): WrappedMethods<T> => {
  // Create an instance if clsOrInstance is a constructor
  const instance =
    typeof clsOrInstance === 'function'
      ? new clsOrInstance(...args)
      : clsOrInstance;

  return new Proxy(instance, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function'
        ? asyncHandler(value.bind(target))
        : value;
    },
    set() {
      throw new Error('Overriding methods and properties is not allowed.');
    },
  }) as WrappedMethods<T>;
};

/**
 * Middleware to serve static files and handle SPA routing.
 * Serves static files from a directory and returns `index.html` for unmatched routes,
 * excluding specified patterns (e.g., API routes).
 *
 * @param {object} [options] - Configuration options.
 * @param {string} [options.path="public"] - Directory to serve static files from.
 * @param {Array<string>|string} [options.exclude='/api{/*path}'] - Routes to exclude from SPA routing.
 * @returns {Router} - Express Router configured for static file serving and SPA routing.
 *
 * @example
 * // Serve static files from "public" directory and handle SPA routing
 * app.use(serveStatic({ path: 'public', exclude: '/api{/*path}' }));
 */
export const serveStatic = (options: ServeOptions = {}): Router => {
  const {exclude = '/api{/*path}', path = join(process.cwd(), 'public')} =
    options;
  const excludes = Array.isArray(exclude) ? exclude : [exclude];

  const indexFile = join(path, 'index.html');
  const excludeMatchers = excludes.map(pattern => match(pattern, {end: false}));

  /** Checks if a path matches any excluded patterns. */
  const isExcluded = (pathname: string): boolean =>
    excludeMatchers.some(matcher => matcher(pathname));

  /** Middleware to serve `index.html` for non-excluded routes. */
  const renderIndex: RequestHandler = (req, res, next) => {
    const pathname = req.originalUrl.split('?')[0];
    if (isExcluded(pathname)) return next();
    res.sendFile(indexFile);
  };

  return express
    .Router()
    .use(express.static(path, {index: false})) // Serve static files
    .get('*', renderIndex); // Handle SPA routing
};
