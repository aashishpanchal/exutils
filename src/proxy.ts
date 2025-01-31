import {ReqHandler} from './types';
import {asyncHandler} from './utils';

type Constructor<T> = new (...args: any[]) => T;

type WrappedMethods<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? ReqHandler : T[K];
};

type ProxyWrapperType = {
  /**
   * Wraps a class constructor in a Proxy, allowing all methods to be
   * automatically wrapped with `asyncHandler`.
   *
   * @param clsOrInstance - The class constructor.
   * @returns A proxied instance where all methods are wrapped with `asyncHandler`.
   *
   * @example
   * class MyClass {
   *   async myMethod() {
   *     return 'Hello, World!';
   *   }
   * }
   * const proxiedInstance = proxyWrapper(MyClass);
   * await proxiedInstance.myMethod(); // Automatically wrapped with asyncHandler
   */
  <T extends object>(clsOrInstance: Constructor<T>): WrappedMethods<T>;

  /**
   * Wraps an instance of a class in a Proxy, allowing all methods to be
   * automatically wrapped with `asyncHandler`.
   *
   * @param clsOrInstance - An instance of the class.
   * @returns A proxied instance where all methods are wrapped with `asyncHandler`.
   *
   * @example
   * class MyClass {
   *   async myMethod() {
   *     return 'Hello, World!';
   *   }
   * }
   * const instance = new MyClass();
   * const proxiedInstance = proxyWrapper(instance);
   * await proxiedInstance.myMethod(); // Automatically wrapped with asyncHandler
   */
  <T extends object>(clsOrInstance: T): WrappedMethods<T>;

  /**
   * Wraps a class constructor in a Proxy, allowing all methods to be
   * automatically wrapped with `asyncHandler`, with constructor arguments.
   *
   * @param clsOrInstance - The class constructor.
   * @param args - The arguments for the class constructor.
   * @returns A proxied instance where all methods are wrapped with `asyncHandler`.
   *
   * @example
   * class MyClass {
   *   constructor(private name: string) {}
   *   async greet() {
   *     return `Hello, ${this.name}!`;
   *   }
   * }
   * const proxiedInstance = proxyWrapper(MyClass, 'Alice');
   * await proxiedInstance.greet(); // Automatically wrapped with asyncHandler
   */
  <T extends object>(
    clsOrInstance: Constructor<T>,
    ...args: ConstructorParameters<Constructor<T>>
  ): WrappedMethods<T>;
};

// Overload signatures
export const proxyWrapper: ProxyWrapperType = <T extends object>(
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
