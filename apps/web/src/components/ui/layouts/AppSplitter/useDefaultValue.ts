import { useCallback } from 'react';
import { sizeToPixels } from './helpers';

interface UseDefaultValueProps {
  defaultLayout: (`${number}px` | `${number}%` | 'auto' | number)[];
  split: 'vertical' | 'horizontal';
  preserveSide: 'left' | 'right';
  leftPanelMinSize?: number | string;
  rightPanelMinSize?: number | string;
  leftPanelMaxSize?: number | string;
  rightPanelMaxSize?: number | string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const useDefaultValue = ({
  defaultLayout,
  split,
  preserveSide,
  leftPanelMinSize,
  rightPanelMinSize,
  leftPanelMaxSize,
  rightPanelMaxSize,
  containerRef,
}: UseDefaultValueProps) => {
  const defaultValue = useCallback(() => {
    const [leftValue, rightValue] = defaultLayout;
    const containerSize =
      split === 'vertical'
        ? (containerRef.current?.offsetWidth ?? 0)
        : (containerRef.current?.offsetHeight ?? 0);

    if (preserveSide === 'left' && leftValue === 'auto') {
      // If preserving left and value is auto, full container is the preserved size
      return containerSize;
    }
    if (preserveSide === 'right' && rightValue === 'auto') {
      // If preserving right and value is auto, full container is the preserved size
      return containerSize;
    }
    const preserveValue = preserveSide === 'left' ? leftValue : rightValue;
    const result = sizeToPixels(preserveValue, containerSize);

    // Clamp the default result to min/max constraints when container size is known
    if (containerSize > 0) {
      const minSize =
        preserveSide === 'left'
          ? sizeToPixels(leftPanelMinSize ?? 0, containerSize)
          : sizeToPixels(rightPanelMinSize ?? 0, containerSize);
      const maxSize =
        preserveSide === 'left'
          ? leftPanelMaxSize
            ? sizeToPixels(leftPanelMaxSize, containerSize)
            : containerSize
          : rightPanelMaxSize
            ? sizeToPixels(rightPanelMaxSize, containerSize)
            : containerSize;

      // Ensure the default respects constraints
      return Math.max(minSize, Math.min(result, maxSize));
    }

    return result;
  }, [defaultLayout, split, preserveSide]);

  return defaultValue;
};
