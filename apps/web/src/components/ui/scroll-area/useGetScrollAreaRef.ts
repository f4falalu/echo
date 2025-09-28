import { useEffect, useRef, useState } from 'react';
import { SCROLL_AREA_VIEWPORT_CLASS } from './ScrollArea';

export const useGetScrollAreaRef = ({
  nodeRef,
  enabled = true,
}: {
  nodeRef: React.RefObject<HTMLDivElement | HTMLElement | null>;
  enabled?: boolean;
}) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [foundScrollArea, setFoundScrollArea] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    setTimeout(() => {
      const matchClass = SCROLL_AREA_VIEWPORT_CLASS;
      const closestMatch = nodeRef.current?.closest(`.${matchClass}`);

      if (closestMatch) {
        scrollAreaRef.current = closestMatch as HTMLDivElement;
        setFoundScrollArea(true);
      }
    }, 150);
  }, [enabled]);

  return { scrollAreaRef, foundScrollArea };
};
