import { useInput } from 'ink';
import { useState } from 'react';

/**
 * Hook for managing content expansion/collapse with Ctrl+O
 * Provides consistent expansion behavior across all message components
 */
export function useExpansion(): [boolean, () => void] {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle Ctrl+O to toggle expansion
  useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      setIsExpanded((prev) => !prev);
    }
  });

  const toggle = () => setIsExpanded((prev) => !prev);

  return [isExpanded, toggle];
}
