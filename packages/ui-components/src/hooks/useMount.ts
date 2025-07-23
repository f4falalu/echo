'use client';

import { useEffect } from 'react';

/**
 * Hook that executes a callback when a component mounts.
 * @param callback Function to be called on mount
 */
export const useMount = (callback: () => void): void => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: we are content with the current dependencies
  useEffect(() => {
    callback();
  }, []); // Empty dependency array means this runs once on mount
};
