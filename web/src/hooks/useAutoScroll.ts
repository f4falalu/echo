import { useCallback, useEffect, useRef, useState } from 'react';
import debounce from 'lodash/debounce';

/**
 * Options for configuring the auto-scroll behavior
 */
interface UseAutoScrollOptions {
  /** Debounce delay in milliseconds for scroll events */
  debounceDelay?: number;
  /** Smooth scroll behavior duration in milliseconds */
  scrollBehavior?: ScrollBehavior;
  /** Whether the auto-scroll functionality is enabled */
  enabled?: boolean;
  /** Whether to observe deep changes in the DOM tree */
  observeDeepChanges?: boolean;
}

/**
 * Return type for the useAutoScroll hook
 */
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

/**
 * Checks if the scrollable element is at the bottom within a given threshold
 * @param element - The HTML element to check
 * @param threshold - The pixel threshold to consider as "at bottom"
 * @returns boolean indicating if the element is scrolled to the bottom
 */
const isAtBottom = (element: HTMLElement, threshold = 30) => {
  const { scrollHeight, scrollTop, clientHeight } = element;
  return scrollHeight - (scrollTop + clientHeight) <= threshold;
};

/**
 * A React hook that provides auto-scrolling functionality for a container element.
 * It automatically scrolls to the bottom when new content is added and provides
 * manual scroll controls.
 *
 * @param containerRef - React ref object pointing to the scrollable container element
 * @param options - Configuration options for the auto-scroll behavior
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 * const {
 *   isAutoScrollEnabled,
 *   scrollToBottom,
 *   enableAutoScroll,
 *   disableAutoScroll
 * } = useAutoScroll(containerRef, {
 *   debounceDelay: 150,
 *   scrollBehavior: 'smooth'
 * });
 * ```
 *
 * @returns An object containing the auto-scroll state and control functions
 */
export const useAutoScroll = (
  containerRef: React.RefObject<HTMLElement>,
  options: UseAutoScrollOptions = {}
): UseAutoScrollReturn => {
  const {
    debounceDelay = 150,
    scrollBehavior = 'smooth',
    enabled = true,
    observeDeepChanges = true
  } = options;

  /** Current state of auto-scroll functionality */
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(enabled);
  /** Tracks if the container was at the bottom during the last scroll event */
  const wasAtBottom = useRef(true);
  /** Tracks if a scroll operation is currently in progress */
  const isScrollingRef = useRef(false);
  /** Reference for the mutation observer's debounced callback */
  const mutationDebounceRef = useRef<number>();
  /** Flag to indicate if a scroll is being forced programmatically */
  const forceScrollRef = useRef(false);

  // Update isAutoScrollEnabled when enabled prop changes
  useEffect(() => {
    setIsAutoScrollEnabled(enabled);
  }, [enabled]);

  /**
   * Scrolls the container to the bottom
   * @param behavior - The scroll behavior to use ('auto', 'smooth', or 'instant')
   */
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

  /**
   * Scrolls the container to the top
   * @param behavior - The scroll behavior to use ('auto', 'smooth', or 'instant')
   */
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

  /**
   * Scrolls the container to bring a specific node into view
   * @param node - The HTML element to scroll into view
   * @param behavior - The scroll behavior to use ('auto', 'smooth', or 'instant')
   */
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

  /**
   * Debounced scroll event handler that manages auto-scroll state based on scroll position
   */
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

  /**
   * Immediate scroll handler that triggers the debounced version
   */
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

    if (!container || !enabled || !isAutoScrollEnabled) return;

    let numberOfMutations = 0;

    // Debounced mutation handler to prevent rapid scroll updates
    const handleMutation = () => {
      numberOfMutations++;
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
      subtree: observeDeepChanges, // Don't observe deep changes
      characterData: false, // Don't observe text changes,
      attributes: false
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

  /**
   * Enables auto-scroll functionality and immediately scrolls to bottom
   */
  const enableAutoScroll = useCallback(() => {
    if (!enabled) return;
    setIsAutoScrollEnabled(true);
    scrollToBottom();
  }, [scrollToBottom, enabled]);

  /**
   * Disables auto-scroll functionality
   */
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
