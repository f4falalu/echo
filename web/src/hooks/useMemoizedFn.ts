'use client';

import { useRef, useMemo } from 'react';

type AnyFunction = (...args: any[]) => any;

export function useMemoizedFn<T extends AnyFunction>(fn: T): T {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  return useMemo(() => {
    const memoizedFn = (...args: Parameters<T>): ReturnType<T> => {
      return fnRef.current(...args);
    };
    return memoizedFn as T;
  }, []);
}
