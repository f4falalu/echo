import { Button } from '@/components/ui/buttons';
import { AppTooltip } from '@/components/ui/tooltip';
import { ColorPicker } from '@/components/ui/color-picker';
import { cn } from '@/lib/utils';
import { useMemoizedFn } from '@/hooks';
import React, { useRef, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColorPickButtonProps {
  colors: string[];
  onColorsChange: (colors: string[]) => void;
}

export const ColorPickButton: React.FC<ColorPickButtonProps> = React.memo(
  ({ colors, onColorsChange }) => {
    // Create items with stable unique IDs for DND kit
    const colorItems = colors.map((color, index) => ({
      id: `${color}-${index}`, // Use color value + index for stability
      color,
      index
    }));

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 8 // Minimum distance to start dragging
        }
      }),
      useSensor(KeyboardSensor)
    );

    const onColorChange = useMemoizedFn((color: string, index: number) => {
      const newColors = colors.reduce((acc, c, i) => {
        if (i === index) return [...acc, color];
        return [...acc, c];
      }, [] as string[]);

      onColorsChange(newColors);
    });

    const handleDragEnd = useMemoizedFn((event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = colorItems.findIndex((item) => item.id === active.id);
        const newIndex = colorItems.findIndex((item) => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          const newColors = arrayMove(colors, oldIndex, newIndex);
          onColorsChange(newColors);
        }
      }
    });

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={colorItems.map((item) => item.id)}
          strategy={horizontalListSortingStrategy}>
          <div className="flex h-7 w-full">
            {colorItems.map((item, currentIndex) => (
              <SortableColorWithPicker
                key={item.id}
                id={item.id}
                color={item.color}
                isFirst={currentIndex === 0}
                isLast={currentIndex === colors.length - 1}
                index={item.index}
                onColorChange={onColorChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }
);

ColorPickButton.displayName = 'ColorPickButton';

// Sortable wrapper component
const SortableColorWithPicker: React.FC<{
  id: string;
  color: string;
  isFirst: boolean;
  isLast: boolean;
  index: number;
  onColorChange: (color: string, index: number) => void;
}> = React.memo(({ id, color, isFirst, isLast, index, onColorChange }) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: isPickerOpen // Disable dragging when picker is open
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  // Only apply drag attributes/listeners when picker is closed
  const dragProps = isPickerOpen ? {} : { ...attributes, ...listeners };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex-1', isDragging && 'z-50')}
      {...dragProps}>
      <ColorWithPicker
        color={color}
        isFirst={isFirst}
        isLast={isLast}
        index={index}
        onColorChange={onColorChange}
        isDragging={isDragging}
        isPickerOpen={isPickerOpen}
        onPickerOpenChange={setIsPickerOpen}
      />
    </div>
  );
});
SortableColorWithPicker.displayName = 'SortableColorWithPicker';

const ColorWithPicker: React.FC<{
  color: string;
  isFirst: boolean;
  isLast: boolean;
  index: number;
  isDragging?: boolean;
  isPickerOpen: boolean;
  onPickerOpenChange: (isOpen: boolean) => void;
  onColorChange: (color: string, index: number) => void;
}> = React.memo(
  ({
    color: colorProp,
    index,
    isFirst,
    isLast,
    isDragging,
    isPickerOpen,
    onPickerOpenChange,
    onColorChange
  }) => {
    const originalColor = useRef(colorProp);
    const [color, setColor] = useState(colorProp);

    return (
      <ColorPicker
        value={color}
        onChange={setColor}
        align="center"
        side="bottom"
        onOpenChange={onPickerOpenChange}
        popoverChildren={
          <div className="flex w-full items-center gap-2 border-t py-2">
            <Button block variant={'default'} onClick={() => setColor(originalColor.current)}>
              Reset
            </Button>
            <Button block variant={'black'} onClick={() => onColorChange(color, index)}>
              Save
            </Button>
          </div>
        }>
        <div
          className={cn(
            'h-full w-full overflow-hidden transition-transform duration-150',
            // Only show cursor-grab when picker is closed and not dragging
            !isPickerOpen && !isDragging && 'cursor-grab hover:z-10 hover:scale-120 hover:shadow',
            isDragging && 'scale-120 cursor-grabbing overflow-visible! opacity-85 shadow-lg',
            !isDragging && isFirst && 'rounded-l',
            !isDragging && isLast && 'rounded-r'
          )}
          style={{ backgroundColor: color }}>
          <AppTooltip title={isDragging ? '' : color} delayDuration={400} skipDelayDuration={500}>
            <div className="h-full w-full" style={{ backgroundColor: color }} />
          </AppTooltip>
        </div>
      </ColorPicker>
    );
  }
);
ColorWithPicker.displayName = 'ColorWithPicker';
