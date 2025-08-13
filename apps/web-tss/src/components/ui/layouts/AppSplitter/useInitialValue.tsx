import { useCallback, useMemo, useState } from 'react';
import { useMemoizedFn } from '../../../../hooks/useMemoizedFn';
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
  mounted: boolean;
}

/**
 * Custom hook to calculate the initial value for the AppSplitter component
 * based on the initial layout and container size constraints
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
  mounted,
}: UseInitialValueProps) => {
  const getInitialValue = () => {
    if (initialLayout) {
      const [leftValue, rightValue] = initialLayout;
      const containerSize =
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0);

      if (preserveSide === 'left' && leftValue === 'auto') {
        return containerSize;
      }
      if (preserveSide === 'right' && rightValue === 'auto') {
        return containerSize;
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

  const initialValue = useMemo(() => {
    return getInitialValue();
  }, [getInitialValue, mounted]);

  return initialValue;
};
