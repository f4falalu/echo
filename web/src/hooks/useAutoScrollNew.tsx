import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoScrollOptions {
  /** Whether auto-scroll is enabled at start */
  enabled?: boolean;
  /**
   * A threshold (in pixels) that defines what "at the bottom" means.
   * When user scrolls within this threshold, auto–scroll re–engages.
   */
  bottomThreshold?: number;
  /**
   * Easing factor determines how aggressively we "chase" the bottom.
   * It is a fraction (0–1) to apply of the remaining distance each frame.
   * Typical values: 0.2–0.3.
   */
  chaseEasing?: number;
}

interface UseAutoScrollReturn {
  /** Whether auto-scroll is currently enabled */
  isAutoScrollEnabled: boolean;
  /** Manually scroll to the bottom (and enable auto–scroll) */
  scrollToBottom: () => void;
  /** Manually scroll to the top (and disable auto–scroll) */
  scrollToTop: () => void;
  /** Manually scroll to a specific node (disables auto–scroll unless near bottom) */
  scrollToNode: (node: HTMLElement) => void;
  /** Enable auto–scroll */
  enableAutoScroll: () => void;
  /** Disable auto–scroll */
  disableAutoScroll: () => void;
}

/**
 * Checks whether an element is "at the bottom" using a pixel threshold.
 */
const isAtBottom = (element: HTMLElement, threshold: number = 30): boolean => {
  const { scrollHeight, scrollTop, clientHeight } = element;
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
};

/**
 * Custom hook that "sticks" a container to its bottom while auto–scroll is enabled.
 *
 * When auto–scroll is active, a continuous chase loop will adjust scrollTop
 * (even if new content is added that increases the scrollHeight). To allow the
 * user to override auto–scroll, we listen to direct input events (wheel, touch, mousedown)
 * and cancel auto–scroll if detected. When the user scrolls back near the bottom
 * (within a threshold), auto–scroll is resumed.
 */
export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn => {
  const { enabled = true, bottomThreshold = 50, chaseEasing = 0.2 } = options;

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(enabled);
  // requestAnimationFrame id for the chasing loop.
  const rAFIdRef = useRef<number | null>(null);

  // This function continuously "chases" the bottom.
  const chaseBottom = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // Dynamically get the current bottom position.
    const target = container.scrollHeight;
    const current = container.scrollTop;
    // Determine the gap between current scroll position and the bottom.
    const gap = target - (current + container.clientHeight);
    if (gap > 1) {
      // Move a fraction of the remaining gap.
      container.scrollTop = current + gap * chaseEasing;
    } else {
      // Snap to bottom if nearly there.
      container.scrollTop = target;
    }
    // Continue the loop if auto-scroll is enabled.
    if (isAutoScrollEnabled) {
      rAFIdRef.current = requestAnimationFrame(chaseBottom);
    }
  }, [containerRef, chaseEasing, isAutoScrollEnabled]);

  // Start or stop the chase loop based on auto-scroll state.
  useEffect(() => {
    if (isAutoScrollEnabled && containerRef.current) {
      rAFIdRef.current = requestAnimationFrame(chaseBottom);
    }
    return () => {
      if (rAFIdRef.current !== null) {
        cancelAnimationFrame(rAFIdRef.current);
        rAFIdRef.current = null;
      }
    };
  }, [isAutoScrollEnabled, chaseBottom, containerRef]);

  // Listen for user–initiated input that indicates the user wants control.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const disableAutoScrollHandler = (event: Event) => {
      // Only disable auto-scroll if we're not at the bottom
      if (!isAtBottom(container, bottomThreshold)) {
        setIsAutoScrollEnabled(false);
        if (rAFIdRef.current !== null) {
          cancelAnimationFrame(rAFIdRef.current);
          rAFIdRef.current = null;
        }
      }
    };
    container.addEventListener('wheel', disableAutoScrollHandler, { passive: true });
    container.addEventListener('touchstart', disableAutoScrollHandler, { passive: true });
    container.addEventListener('mousedown', disableAutoScrollHandler, { passive: true });
    return () => {
      container.removeEventListener('wheel', disableAutoScrollHandler);
      container.removeEventListener('touchstart', disableAutoScrollHandler);
      container.removeEventListener('mousedown', disableAutoScrollHandler);
    };
  }, [containerRef, bottomThreshold]);

  // Listen for scroll events. If the user scrolls back close to the bottom, re-enable auto–scroll.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeoutId: NodeJS.Timeout | null = null;

    const onScroll = () => {
      // For scroll events, we want to check immediately if we're at the bottom
      // to provide responsive auto-scroll re-enabling
      if (isAtBottom(container, bottomThreshold)) {
        if (!isAutoScrollEnabled) {
          setIsAutoScrollEnabled(true);
        }
        return;
      }

      // For other scroll positions, we can debounce to avoid excessive state updates
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }

      scrollTimeoutId = setTimeout(() => {
        if (isAtBottom(container, bottomThreshold)) {
          setIsAutoScrollEnabled(true);
        }
      }, 100);
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeoutId) {
        clearTimeout(scrollTimeoutId);
      }
    };
  }, [containerRef, bottomThreshold, isAutoScrollEnabled]);

  // Exposed functions.

  // Immediately scroll to bottom and enable auto–scroll.
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoScrollEnabled(true);
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [containerRef]);

  // Scroll to the top and disable auto–scroll.
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoScrollEnabled(false);
    containerRef.current.scrollTop = 0;
  }, [containerRef]);

  // Scroll to a specific node inside the container and disable auto-scroll.
  const scrollToNode = useCallback(
    (node: HTMLElement) => {
      if (!containerRef.current || !node) return;
      setIsAutoScrollEnabled(false);
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      const targetScroll = container.scrollTop + (nodeRect.top - containerRect.top);
      container.scrollTop = targetScroll;
    },
    [containerRef]
  );

  // Explicitly enable or disable auto scroll.
  const enableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(true);
  }, []);

  const disableAutoScroll = useCallback(() => {
    setIsAutoScrollEnabled(false);
  }, []);

  return {
    isAutoScrollEnabled,
    scrollToBottom,
    scrollToTop,
    scrollToNode,
    enableAutoScroll,
    disableAutoScroll
  };
};
