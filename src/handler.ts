import {asyncHandler} from './utils';

type Constructor<T> = new (...args: any[]) => T;

/**
 * Retrieves a request handler from a class instance method.
 *
 * This function takes a class constructor and constructor arguments,
 * and returns a function that can be used to get a specific method from
 * an instance of that class, wrapped in an async handler. This is useful
 * for routing in web frameworks.
 *
 * @param cls - The class constructor from which to create an instance.
 * @param args - The arguments to pass to the class constructor.
 * @returns A function that retrieves a method from the class instance.
 *
 * @example
 * class MyController {
 *   constructor(private message: string) {}
 *
 *   async getData(req, res) {
 *     // Your logic here
 *     res.send('Data retrieved');
 *   }
 * }
 *
 * const handler = getHandlerFromClass(MyController, 'Hello, World!');
 * const getDataHandler = handler('getData');
 * // Now `getDataHandler` can be used as a route handler.
 */
export const getHandlerFromClass = <T extends object>(
  cls: Constructor<T>,
  ...args: ConstructorParameters<Constructor<T>>
) => {
  const instance = new cls(...args);
  /**
   * Retrieves and wraps a method from the controller for routing.
   *
   * @param key - The method name to retrieve.
   * @returns A wrapped request handler.
   *
   * @throws Will throw an error if the key does not correspond to a function.
   */
  return <K extends keyof T>(key: K) => {
    // get handler from instance
    const handler = instance[key];
    if (typeof handler !== 'function')
      throw new Error(
        `The key '${String(key)}' is not a function in ${cls.constructor.name}.`,
      );
    // return handler with wrapper
    return asyncHandler(handler.bind(instance));
  };
};
