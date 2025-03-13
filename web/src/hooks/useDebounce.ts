'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import useLatest from './useLatest';
import debounce from 'lodash/debounce';
import { useUnmount } from './useUnmount';

interface DebounceOptions {
  wait?: number;
  maxWait?: number;
  leading?: boolean;
}

type noop = (...args: any[]) => any;

export function useDebounceFn<T extends noop>(fn: T, options?: DebounceOptions) {
  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  const debounced = useMemo(
    () =>
      debounce(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options
      ),
    []
  );

  useUnmount(() => {
    debounced.cancel();
  });

  return {
    run: debounced,
    cancel: debounced.cancel,
    flush: debounced.flush
  };
}

export default useDebounceFn;

export function useDebounce<T>(value: T, options: DebounceOptions = {}) {
  const { wait = 1000, maxWait } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastUpdateTime = useRef<number>(Date.now());
  const valueRef = useRef<T>(value);

  // Keep latest value in ref
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Clear both timeouts on cleanup
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    clearTimeouts();
    const now = Date.now();

    // Set up the regular debounce timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(valueRef.current);
      lastUpdateTime.current = Date.now();
    }, wait);

    // Handle maxWait
    if (maxWait) {
      const timeSinceLastUpdate = now - lastUpdateTime.current;
      const maxWaitTimeRemaining = Math.max(0, maxWait - timeSinceLastUpdate);

      maxTimeoutRef.current = setTimeout(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          setDebouncedValue(valueRef.current);
          lastUpdateTime.current = Date.now();
        }
      }, maxWaitTimeRemaining);
    }

    return () => clearTimeouts();
  }, [value, wait, maxWait, clearTimeouts]);

  return debouncedValue;
}
