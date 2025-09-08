import { DndPlugin } from '@platejs/dnd';
import { PlaceholderPlugin } from '@platejs/media/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { BlockDraggable } from '../elements/BlockDraggable';

export const DndKit = ({
  containerRef,
}: {
  containerRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  return [
    DndPlugin.configure({
      options: {
        enableScroller: true,
        onDropFiles: ({ dragItem, editor, target }) => {
          editor
            .getTransforms(PlaceholderPlugin)
            .insert.media(dragItem.files, { at: target, nextBlock: false });
        },
        scrollerProps: {
          enabled: true,
          // Container to scroll (defaults to window)
          containerRef: containerRef, // React.RefObject<any>

          // Height of the scroll trigger zones at top/bottom
          height: 200, // pixels - try increasing for easier triggering

          // Minimum strength threshold (0-1)
          minStrength: 0.05, // Lower = more sensitive, try 0.1 or 0.05

          // Speed multiplier for scrolling
          strengthMultiplier: 35, // Higher = faster scrolling, try 35-50

          // Z-index for the scroll areas
          zIndex: 10_000,

          // Additional props for the scroll areas
          //DO NOT REMOVE THIS. It was actually needed haha
          scrollAreaProps: {
            style: {
              backgroundColor: 'transparent',
            },
          },
        },
      },
      render: {
        aboveNodes: BlockDraggable,
        aboveSlate: ({ children }) => <DndProvider backend={HTML5Backend}>{children}</DndProvider>,
      },
    }),
  ];
};
