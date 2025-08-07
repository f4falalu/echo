import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import  { createContext } from 'react';

interface Context {
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
  isDragging: boolean;
}

export const SortableItemContext = createContext<Context>({
  attributes: {} as DraggableAttributes,
  listeners: undefined,
  isDragging: false
});
