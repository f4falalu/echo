import { useMemo, useRef } from 'react';
import type { LayoutSize } from './AppSplitter.types';
import { sizeToPixels } from './helpers';

interface UseInitialValueProps {
  initialLayout: LayoutSize | null;
  split: 'vertical' | 'horizontal';
  preserveSide: 'left' | 'right';
  leftPanelMinSize?: number | string;
  rightPanelMinSize?: number | string;
  leftPanelMaxSize?: number | string;
  rightPanelMaxSize?: number | string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  autoSaveId: string;
}

/**
 * Custom hook to calculate the initial value for the AppSplitter component
 * based on the initial layout and container size constraints.
 *
 * IMPORTANT: This hook should only use the initial value on first calculation,
 * not recalculate when autoSaveId changes to prevent animation snapping.
 */
export const useInitialValue = ({
  initialLayout,
  split,
  preserveSide,
  leftPanelMinSize = 0,
  rightPanelMinSize = 0,
  leftPanelMaxSize,
  rightPanelMaxSize,
  containerRef,
  autoSaveId,
}: UseInitialValueProps) => {
  // Track whether this is the first calculation for this component instance
  const hasInitializedRef = useRef(false);
  const firstAutoSaveIdRef = useRef(autoSaveId);

  // Only consider this a "first calculation" if the autoSaveId hasn't changed from the original
  const isFirstCalculation =
    !hasInitializedRef.current && firstAutoSaveIdRef.current === autoSaveId;

  const getInitialValue = () => {
    // Only use initialLayout on the very first calculation or when autoSaveId is the same as original
    if (!isFirstCalculation && hasInitializedRef.current) {
      return null; // Don't use initial layout for subsequent autoSaveId changes
    }

    if (initialLayout) {
      const [leftValue, rightValue] = initialLayout;
      const containerSize =
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0);

      if (preserveSide === 'left' && leftValue === 'auto') {
        return '100%';
      }
      if (preserveSide === 'right' && rightValue === 'auto') {
        return '100%';
      }

      const preserveValue = preserveSide === 'left' ? leftValue : rightValue;
      const result = sizeToPixels(preserveValue, containerSize);

      // Check if the result is within min/max bounds
      if (containerSize > 0) {
        const minSize =
          preserveSide === 'left'
            ? sizeToPixels(leftPanelMinSize, containerSize)
            : sizeToPixels(rightPanelMinSize, containerSize);
        const maxSize =
          preserveSide === 'left'
            ? leftPanelMaxSize
              ? sizeToPixels(leftPanelMaxSize, containerSize)
              : containerSize
            : rightPanelMaxSize
              ? sizeToPixels(rightPanelMaxSize, containerSize)
              : containerSize;

        // If the result is outside the min/max bounds, return null to use default value
        if (result < minSize || result > maxSize) {
          return null;
        }
      }

      return result;
    }
    return null;
  };

  const memoizedInitialValue = useMemo(() => {
    const value = getInitialValue();
    // Mark as initialized after first successful calculation
    if (value !== null || isFirstCalculation) {
      hasInitializedRef.current = true;
    }
    return value;
  }, [
    autoSaveId,
    initialLayout,
    split,
    preserveSide,
    leftPanelMinSize,
    rightPanelMinSize,
    leftPanelMaxSize,
    rightPanelMaxSize,
  ]);

  return memoizedInitialValue;
};
