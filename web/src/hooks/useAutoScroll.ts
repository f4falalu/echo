import { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

interface UseAutoScrollOptions {
  /** Debounce delay in milliseconds for scroll events */
  debounceDelay?: number;
  /** Smooth scroll behavior duration in milliseconds */
  scrollBehavior?: ScrollBehavior;
  /** Whether the auto-scroll functionality is enabled */
  enabled?: boolean;
}

interface UseAutoScrollReturn {
  /** Whether auto-scrolling is currently enabled */
  isAutoScrollEnabled: boolean;
  /** Manually scroll to the bottom of the container */
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  /** Manually scroll to the top of the container */
  scrollToTop: (behavior?: ScrollBehavior) => void;
  /** Manually scroll to a specific node */
  scrollToNode: (node: HTMLElement, behavior?: ScrollBehavior) => void;

  /** Enable auto-scrolling */
  enableAutoScroll: () => void;
  /** Disable auto-scrolling */
  disableAutoScroll: () => void;
}

const isAtBottom = (element: HTMLElement, threshold = 30) => {
  const { scrollHeight, scrollTop, clientHeight } = element;
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
};

export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn => {
  const { debounceDelay = 150, scrollBehavior = 'smooth', enabled = true } = options;

  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(enabled);
  const wasAtBottom = useRef(true);
  const isScrollingRef = useRef(false);
  const mutationDebounceRef = useRef<number>();
  const forceScrollRef = useRef(false);

  // Update isAutoScrollEnabled when enabled prop changes
  useEffect(() => {
    setIsAutoScrollEnabled(enabled);
  }, [enabled]);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = scrollBehavior) => {
      if (!containerRef.current) return;

      // Set a flag to ignore scroll events while we're forcing a scroll
      forceScrollRef.current = true;
      isScrollingRef.current = false;

      // Use RAF to ensure we scroll after any pending updates
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        containerRef.current.scrollTo({
          top: containerRef.current.scrollHeight,
          behavior
        });

        // Only enable auto-scroll if the feature is enabled
        if (enabled) {
          setIsAutoScrollEnabled(true);
          wasAtBottom.current = true;
        }

        // Reset the force scroll flag after the scroll completes
        if (behavior === 'instant') {
          forceScrollRef.current = false;
        } else {
          // For smooth scrolling, wait for the animation to complete
          setTimeout(() => {
            forceScrollRef.current = false;
          }, 300); // Typical smooth scroll duration
        }
      });
    },
    [containerRef, scrollBehavior, enabled]
  );

  const scrollToTop = useCallback(
    (behavior: ScrollBehavior = scrollBehavior) => {
      if (!containerRef.current) return;

      containerRef.current.scrollTo({
        top: 0,
        behavior
      });
    },
    [containerRef, scrollBehavior]
  );

  const scrollToNode = useCallback(
    (node: HTMLElement, behavior: ScrollBehavior = scrollBehavior) => {
      if (!containerRef.current || !node) return;

      // Set a flag to ignore scroll events while we're forcing a scroll
      forceScrollRef.current = true;
      isScrollingRef.current = false;

      // Use RAF to ensure we scroll after any pending updates
      requestAnimationFrame(() => {
        if (!containerRef.current) return;

        // Get the node's position relative to the container
        const containerRect = containerRef.current.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const scrollTop = nodeRect.top - containerRect.top + containerRef.current.scrollTop;

        containerRef.current.scrollTo({
          top: scrollTop,
          behavior
        });

        // Check if we're scrolling to the bottom
        const isBottom =
          Math.abs(
            containerRef.current.scrollHeight - (scrollTop + containerRef.current.clientHeight)
          ) <= 30;

        // Only enable auto-scroll if the feature is enabled
        if (isBottom && enabled) {
          setIsAutoScrollEnabled(true);
          wasAtBottom.current = true;
        }

        // Reset the force scroll flag after the scroll completes
        if (behavior === 'instant') {
          forceScrollRef.current = false;
        } else {
          // For smooth scrolling, wait for the animation to complete
          setTimeout(() => {
            forceScrollRef.current = false;
          }, 300); // Typical smooth scroll duration
        }
      });
    },
    [containerRef, scrollBehavior, enabled]
  );

  // Debounced scroll handler
  const handleScrollThrottled = useCallback(
    debounce(() => {
      if (!containerRef.current || forceScrollRef.current || !enabled) return;

      const atBottom = isAtBottom(containerRef.current);

      if (wasAtBottom.current && !atBottom) {
        // Only disable if we were at bottom and scrolled up
        setIsAutoScrollEnabled(false);
      } else if (atBottom) {
        // Enable when we reach bottom
        setIsAutoScrollEnabled(true);
      }

      wasAtBottom.current = atBottom;
      isScrollingRef.current = false;
    }, debounceDelay),
    [containerRef, enabled]
  );

  // Immediate scroll handler that calls the debounced version
  const handleScroll = useCallback(() => {
    if (forceScrollRef.current || !enabled) return;

    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
    }
    handleScrollThrottled();
  }, [handleScrollThrottled, enabled]);

  // Handle content changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    // Debounced mutation handler to prevent rapid scroll updates
    const handleMutation = () => {
      if (mutationDebounceRef.current) {
        window.cancelAnimationFrame(mutationDebounceRef.current);
      }

      mutationDebounceRef.current = window.requestAnimationFrame(() => {
        if (isAutoScrollEnabled && !isScrollingRef.current && !forceScrollRef.current) {
          scrollToBottom();
        }
      });
    };

    const observer = new MutationObserver(handleMutation);

    observer.observe(container, {
      childList: true, // Only observe direct children changes
      subtree: false, // Don't observe deep changes
      characterData: false // Don't observe text changes
    });

    return () => {
      observer.disconnect();
      if (mutationDebounceRef.current) {
        window.cancelAnimationFrame(mutationDebounceRef.current);
      }
    };
  }, [containerRef, isAutoScrollEnabled, scrollToBottom, enabled]);

  // Handle scroll events
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      handleScrollThrottled.cancel();
    };
  }, [containerRef, handleScroll, handleScrollThrottled, enabled]);

  const enableAutoScroll = useCallback(() => {
    if (!enabled) return;
    setIsAutoScrollEnabled(true);
    scrollToBottom();
  }, [scrollToBottom, enabled]);

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
