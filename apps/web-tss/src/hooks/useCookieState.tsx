import { isServer } from '@tanstack/react-query';
import cookies from 'js-cookie';
import { useState } from 'react';
import { useMemoizedFn } from './useMemoizedFn';
import { useMount } from './useMount';

type SetState<S> = S | ((prevState?: S) => S);

// Default expiration time: 7 days in milliseconds
const DEFAULT_EXPIRATION_TIME = 7 * 24 * 60 * 60 * 1000;

interface StorageData<T> {
  value: T;
  timestamp: number;
}

interface CookieOptions {
  domain?: string;
  path?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

interface Options<T> {
  defaultValue?: T | (() => T);
  initialValue?: T | (() => T);
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: unknown) => void;
  expirationTime?: number;
  cookieOptions?: CookieOptions;
}

// Helper function to set a cookie using js-cookie
const setCookie = (
  name: string,
  value: string,
  expirationTime: number,
  options: CookieOptions = {}
): void => {
  if (isServer) return;

  const expires = new Date(Date.now() + expirationTime);
  const { domain, path = '/', secure = true, sameSite = 'lax' } = options;

  cookies.set(name, value, {
    expires,
    path,
    domain,
    secure,
    sameSite,
  });
};

// Helper function to remove a cookie using js-cookie
const removeCookie = (name: string, options: CookieOptions = {}): void => {
  if (isServer) return;

  const { domain, path = '/' } = options;
  cookies.remove(name, { path, domain });
};

export function useCookieState<T>(
  key: string,
  options?: Options<T>
): [T | undefined, (value?: SetState<T>) => void, () => T | undefined] {
  const {
    defaultValue,
    initialValue,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    onError,
    expirationTime = DEFAULT_EXPIRATION_TIME,
    cookieOptions = {},
  } = options || {};

  const executeBustStorage = useMemoizedFn(() => {
    if (!isServer) removeCookie(key, cookieOptions);
    return typeof defaultValue === 'function' ? (defaultValue as () => T)() : defaultValue;
  });

  // Get initial value from cookies or use default
  const getInitialValue = useMemoizedFn((): T | undefined => {
    // Prefer explicitly provided initialValue if present
    if (initialValue !== undefined) {
      return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
    }

    try {
      const cookieValue = cookies.get(key);

      if (!cookieValue) {
        return executeBustStorage();
      }

      // Parse the stored data which includes value and timestamp
      const storageData: StorageData<T> = JSON.parse(cookieValue);

      // Check if the stored data has the expected structure
      if (
        typeof storageData !== 'object' ||
        storageData === null ||
        !('value' in storageData) ||
        !('timestamp' in storageData)
      ) {
        // If the data doesn't have the expected structure (legacy data), treat as expired
        return executeBustStorage();
      }

      // Check if the data has expired
      const currentTime = Date.now();
      const timeDifference = currentTime - storageData.timestamp;

      if (timeDifference > expirationTime) {
        // Data has expired, remove it and return default value
        return executeBustStorage();
      }

      // Data is still valid, deserialize and return the value
      const deserializedValue = deserializer(JSON.stringify(storageData.value));

      return deserializedValue;
    } catch (error) {
      onError?.(error);
      return executeBustStorage();
    }
  });

  const [state, setState] = useState<T | undefined>(() => getInitialValue());

  // Initialize state from cookies on mount
  useMount(() => {
    setState(getInitialValue());
  });

  // Setter function that handles both direct values and function updates
  const setStoredState = useMemoizedFn((value?: SetState<T>) => {
    try {
      setState((prevState) => {
        // Calculate the new state value
        const newState =
          typeof value === 'function' ? (value as (prevState?: T) => T)(prevState) : value;

        // Update cookie with the new state
        if (newState === undefined && !isServer) {
          removeCookie(key, cookieOptions);
        } else {
          // Create storage data with current timestamp
          const storageData: StorageData<T> = {
            value: JSON.parse(serializer(newState)),
            timestamp: Date.now(),
          };
          setCookie(key, JSON.stringify(storageData), expirationTime, cookieOptions);
        }

        return newState;
      });
    } catch (error) {
      onError?.(error);
    }
  });

  return [state, setStoredState, executeBustStorage];
}
