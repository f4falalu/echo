'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface DebounceOptions {
  wait?: number;
  maxWait?: number;
  leading?: boolean;
}

export function useDebounceFn<T extends (...args: any[]) => any>(
  fn: T,
  options: DebounceOptions = {}
) {
  const { wait = 1000, maxWait, leading = false } = options;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const maxTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const fnRef = useRef<T>(fn);
  const argsRef = useRef<Parameters<T> | null>(null);
  const lastCallTime = useRef<number>(0);

  // Update the function ref when fn changes
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }
  }, []);

  const run = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;
      const now = Date.now();

      if (leading && !timeoutRef.current) {
        fnRef.current(...args);
        lastCallTime.current = now;
      }

      cancel();

      timeoutRef.current = setTimeout(() => {
        if (!leading && argsRef.current) {
          fnRef.current(...argsRef.current);
        }
        lastCallTime.current = now;
      }, wait);

      // Handle maxWait
      if (maxWait && !maxTimeoutRef.current && !leading) {
        const timeSinceLastCall = now - lastCallTime.current;
        const maxWaitTimeRemaining = Math.max(0, maxWait - timeSinceLastCall);

        maxTimeoutRef.current = setTimeout(() => {
          if (timeoutRef.current && argsRef.current) {
            clearTimeout(timeoutRef.current);
            fnRef.current(...argsRef.current);
            lastCallTime.current = Date.now();
          }
          maxTimeoutRef.current = undefined;
        }, maxWaitTimeRemaining);
      }
    },
    [wait, maxWait, leading, cancel]
  );

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return {
    run,
    cancel
  };
}

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
