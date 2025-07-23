'use client';

import { useEffect } from 'react';

/**
 * Hook that executes a callback when a component unmounts.
 * @param callback Function to be called on unmount
 */
export const useUnmount = (callback: () => void): void => {
  // biome-ignore lint/correctness/useExhaustiveDependencies: this is a mount only hook
  useEffect(() => {
    return () => {
      callback();
    };
  }, []); // Empty dependency array means this runs once on mount
};
