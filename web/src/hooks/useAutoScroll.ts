import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoScrollOptions {
  /** Whether auto-scroll is enabled at start */
  enabled?: boolean;
  /**
   * A threshold (in pixels) that defines what “at the bottom” means.
   * When the user is within this threshold from the bottom, auto-scroll will re–engage.
   */
  bottomThreshold?: number;
  /**
   * Easing factor determines how aggressively we “chase” the bottom.
   * It is a fraction (0–1) of the remaining distance applied each frame.
   * Typical values: 0.2–0.3.
   */
  chaseEasing?: number;

  /**
   * Whether to observe deep changes in the container.
   * If true, the hook will observe changes to the container's content and scroll position.
   * If false, the hook will only observe changes to the container's scroll position.
   */
  observeDeepChanges?: boolean;
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
 * Checks whether an element is “at the bottom” using a pixel threshold.
 */
const isAtBottom = (element: HTMLElement, threshold: number = 30): boolean => {
  const { scrollHeight, scrollTop, clientHeight } = element;
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
};

/**
 * Custom hook that “sticks” a container to its bottom while auto–scroll is enabled.
 *
 * It uses a continuous chase loop (via requestAnimationFrame) to nudge the container’s
 * scrollTop toward its current scrollHeight. In addition, input events (wheel, touchstart,
 * mousedown) will disable auto–scroll only if the container is not near the bottom.
 *
 * When the container is scrolled back near the bottom (within bottomThreshold), auto–scroll
 * is re–enabled.
 */
export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn => {
  const {
    enabled = true,
    bottomThreshold = 50,
    chaseEasing = 0.2,
    observeDeepChanges = true
  } = options;

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(enabled);
  // requestAnimationFrame id for the chase loop.
  const rAFIdRef = useRef<number | null>(null);

  // The chase loop continuously nudges scrollTop toward the current bottom.
  const chaseBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // Re-read the current bottom dynamically.
    const target = container.scrollHeight;
    const current = container.scrollTop;
    const gap = target - (current + container.clientHeight);
    if (gap > 1) {
      container.scrollTop = current + gap * chaseEasing;
    } else {
      // Once close enough, snap to the bottom.
      container.scrollTop = target;
    }
    if (isAutoScrollEnabled) {
      rAFIdRef.current = requestAnimationFrame(chaseBottom);
    }
  }, [containerRef, chaseEasing, isAutoScrollEnabled]);

  // Start or stop the chase loop based on auto–scroll state.
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

  // Listen for user–initiated events. Only disable auto–scroll if the container isn’t near the bottom.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const disableAutoScrollHandler = () => {
      // Only disable auto–scroll if we're not near the bottom.
      if (!isAtBottom(container, bottomThreshold)) {
        setIsAutoScrollEnabled(false);
        if (rAFIdRef.current !== null) {
          cancelAnimationFrame(rAFIdRef.current);
          rAFIdRef.current = null;
        }
      }
      // Otherwise, if the container is at the bottom, leave auto–scroll enabled.
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

    const onScroll = () => {
      if (isAtBottom(container, bottomThreshold)) {
        setIsAutoScrollEnabled(true);
      }
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, bottomThreshold]);

  // Exposed functions.

  // Immediately scroll to bottom and enable auto–scroll.
  const scrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoScrollEnabled(true);
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [containerRef]);

  // Scroll to top and disable auto–scroll.
  const scrollToTop = useCallback(() => {
    if (!containerRef.current) return;
    setIsAutoScrollEnabled(false);
    containerRef.current.scrollTop = 0;
  }, [containerRef]);

  // Scroll to a specific node and disable auto–scroll.
  const scrollToNode = useCallback(
    (node: HTMLElement) => {
      if (!containerRef.current || !node) return;
      setIsAutoScrollEnabled(false);
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const nodeRect = node.getBoundingClientRect();
      // Calculate the target scroll position relative to the container.
      const targetScroll = container.scrollTop + (nodeRect.top - containerRect.top);
      container.scrollTop = targetScroll;
    },
    [containerRef]
  );

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
