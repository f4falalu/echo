'use client';

import { useState, useCallback } from 'react';

/**
 * A hook that provides a stateful Set with methods to modify it.
 * @template T The type of elements in the Set
 * @returns A tuple containing the Set and methods to modify it
 */
export function useSet<T>(initialValues: T[] = []): [
  Set<T>,
  {
    add: (value: T) => void;
    remove: (value: T) => void;
    toggle: (value: T) => void;
    clear: () => void;
    has: (value: T) => boolean;
  }
] {
  const [set, setSet] = useState<Set<T>>(() => new Set(initialValues));

  const add = useCallback((value: T) => {
    setSet((prevSet) => {
      const newSet = new Set(prevSet);
      newSet.add(value);
      return newSet;
    });
  }, []);

  const remove = useCallback((value: T) => {
    setSet((prevSet) => {
      const newSet = new Set(prevSet);
      newSet.delete(value);
      return newSet;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet((prevSet) => {
      const newSet = new Set(prevSet);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        newSet.add(value);
      }
      return newSet;
    });
  }, []);

  const clear = useCallback(() => {
    setSet(new Set());
  }, []);

  const has = useCallback((value: T) => set.has(value), [set]);

  return [
    set,
    {
      add,
      remove,
      toggle,
      clear,
      has
    }
  ];
}
