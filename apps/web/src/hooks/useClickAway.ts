'use client';

import { useEffect, useRef, MutableRefObject } from 'react';
import { useLatest } from './useLatest';

type Target = HTMLElement | null | undefined;
type TargetRef = MutableRefObject<Target>;

/**
 * Hook that detects clicks outside of the specified element(s)
 * @param onClickAway - Callback function to execute when clicking outside
 * @param targets - Single ref or array of refs to monitor for outside clicks
 * @param eventName - Mouse event to listen for (default: 'mousedown')
 */
export function useClickAway(
  onClickAway: (event: MouseEvent | TouchEvent) => void,
  targets: TargetRef | TargetRef[],
  eventName: 'mousedown' | 'mouseup' | 'click' = 'mousedown'
) {
  // Use useLatest to ensure we always have the latest callback
  const onClickAwayRef = useLatest(onClickAway);

  // Normalize targets to always be an array
  const targetsRef = useRef<TargetRef[]>([]);

  useEffect(() => {
    targetsRef.current = Array.isArray(targets) ? targets : [targets];
  }, [targets]);

  useEffect(() => {
    // Handler for document clicks
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;

      // Check if the click was inside any of the target elements
      const isClickInside = targetsRef.current.some((targetRef) => {
        const element = targetRef.current;
        return element && (element === target || element.contains(target));
      });

      // If click was outside all targets, call the callback
      if (!isClickInside) {
        onClickAwayRef.current(event);
      }
    };

    // Add event listeners
    document.addEventListener(eventName, handler);
    // Also listen for touch events on mobile
    document.addEventListener('touchstart', handler);

    // Cleanup
    return () => {
      document.removeEventListener(eventName, handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [eventName, onClickAwayRef]);
}

/**
 * Hook that detects clicks outside of the specified element(s) and returns a ref
 * This is a convenience wrapper that creates the ref for you
 * @param onClickAway - Callback function to execute when clicking outside
 * @param eventName - Mouse event to listen for (default: 'mousedown')
 * @returns ref to attach to the element
 */
export function useClickAwayRef<T extends HTMLElement = HTMLElement>(
  onClickAway: (event: MouseEvent | TouchEvent) => void,
  eventName: 'mousedown' | 'mouseup' | 'click' = 'mousedown'
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);
  useClickAway(onClickAway, ref, eventName);
  return ref;
}
