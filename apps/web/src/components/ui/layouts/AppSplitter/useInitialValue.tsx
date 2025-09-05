import { useRef } from 'react';
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
}

/**
 * Custom hook to calculate the initial value for the AppSplitter component
 * based on the initial layout and container size constraints.
 *
 * IMPORTANT: This value is calculated once on first mount and never changes,
 * preventing animation snapping when props change.
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
}: UseInitialValueProps) => {
  // Store the calculated initial value - never recalculate after first mount
  const initialValueRef = useRef<number | '100%' | null>(null);
  const hasCalculatedRef = useRef(false);

  // Calculate once and store in ref
  if (!hasCalculatedRef.current) {
    hasCalculatedRef.current = true;

    if (initialLayout) {
      const [leftValue, rightValue] = initialLayout;
      const containerSize =
        split === 'vertical'
          ? (containerRef.current?.offsetWidth ?? 0)
          : (containerRef.current?.offsetHeight ?? 0);

      // Handle 'auto' values - they should fill the container
      if (preserveSide === 'left' && leftValue === 'auto') {
        initialValueRef.current = '100%';
      } else if (preserveSide === 'right' && rightValue === 'auto') {
        initialValueRef.current = '100%';
      } else {
        // Calculate specific size
        const preserveValue = preserveSide === 'left' ? leftValue : rightValue;
        const result = sizeToPixels(preserveValue, containerSize);

        // Validate against min/max bounds if container has size
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

          // Use result if within bounds, otherwise null (use default)
          initialValueRef.current = result >= minSize && result <= maxSize ? result : null;
        } else {
          initialValueRef.current = result;
        }
      }
    } else {
      initialValueRef.current = null;
    }
  }

  return initialValueRef.current;
};
