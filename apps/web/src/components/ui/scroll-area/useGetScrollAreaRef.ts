import { useEffect, useRef } from 'react';
import { SCROLL_AREA_VIEWPORT_CLASS } from './ScrollArea';

export const useGetScrollAreaRef = ({
  nodeRef,
  enabled = true,
}: {
  nodeRef: React.RefObject<HTMLDivElement | HTMLElement | null>;
  enabled?: boolean;
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    requestAnimationFrame(() => {
      const matchClass = SCROLL_AREA_VIEWPORT_CLASS;
      const closestMatch = nodeRef.current?.closest(`.${matchClass}`);

      if (closestMatch) {
        scrollAreaRef.current = closestMatch as HTMLDivElement;
      }
    });
  }, [enabled]);

  return scrollAreaRef;
};
