'use client';

import { type DependencyList, useEffect, useRef } from 'react';

/**
 * A hook that executes a function on the second update and subsequent updates.
 * Similar to useEffect but skips the first render.
 * @param effect The effect function to run
 * @param deps The dependencies array
 */
export const useUpdateEffect = (effect: () => void, deps?: DependencyList) => {
  const isFirstRender = useRef(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: we will run this when the deps change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    return effect();
  }, deps);
};
