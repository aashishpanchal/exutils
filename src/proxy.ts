import {asyncHandler} from './utils';
import type {Constructor, ProxyWrapper, WrappedMethods} from './types';

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
