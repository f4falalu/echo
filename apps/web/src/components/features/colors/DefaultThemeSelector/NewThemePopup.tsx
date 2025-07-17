import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Text } from '@/components/ui/typography';
import React, { useEffect, useRef, useState } from 'react';
import type { IColorTheme } from '../ThemeList';
import { useMemoizedFn } from '@/hooks';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash } from '../../../ui/icons';
import { Popover } from '../../../ui/popover';
import { ALL_THEMES } from '../themes';
import { AppTooltip } from '../../../ui/tooltip';
import { cn } from '@/lib/utils';
import { ColorPicker } from '../../../ui/color-picker';
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

interface NewThemePopupProps {
  isOpen: boolean;
  selectedTheme?: IColorTheme;
  onSave: (theme: IColorTheme) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_THEME: IColorTheme = ALL_THEMES[0];

export const NewThemePopup = React.memo(
  ({ selectedTheme, isOpen, onDelete, onSave }: NewThemePopupProps) => {
    const [title, setTitle] = useState('');
    const [colors, setColors] = useState<string[]>(DEFAULT_THEME.colors);
    const [id, setId] = useState(uuidv4());

    const isNewTheme = !selectedTheme;

    const onDeleteClick = useMemoizedFn(() => {
      if (selectedTheme) onDelete(id);
    });

    const onSaveClick = useMemoizedFn(() => {
      onSave({ id, name: title, colors });
    });

    useEffect(() => {
      if (isOpen) {
        setTitle(selectedTheme?.name || '');
        setColors(selectedTheme?.colors || DEFAULT_THEME.colors);
        setId(selectedTheme?.id || uuidv4());
      }
    }, [isOpen, selectedTheme]);

    return (
      <div className="w-[280px]">
        <div className="grid grid-cols-[80px_1fr] items-center gap-2 p-2.5">
          <Text>Title</Text>
          <Input />
          <Text>Theme</Text>
          <ColorPickButton colors={colors} onColorsChange={setColors} />
        </div>
        <div className="w-full border-t"></div>

        <div className="p-2.5">
          <Button
            block
            onClick={isNewTheme ? onSaveClick : onDeleteClick}
            prefix={isNewTheme ? <Plus /> : <Trash />}>
            {isNewTheme ? 'Create theme' : 'Delete theme'}
          </Button>
        </div>
      </div>
    );
  }
);

NewThemePopup.displayName = 'NewThemePopup';

const ColorPickButton: React.FC<{
  colors: string[];
  onColorsChange: (colors: string[]) => void;
}> = React.memo(({ colors, onColorsChange }) => {
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
});
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('flex-1', isDragging && 'z-50')}
      {...attributes}
      {...listeners}>
      <ColorWithPicker
        color={color}
        isFirst={isFirst}
        isLast={isLast}
        index={index}
        onColorChange={onColorChange}
        isDragging={isDragging}
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
  onColorChange: (color: string, index: number) => void;
}> = React.memo(({ color: colorProp, index, isFirst, isLast, isDragging, onColorChange }) => {
  const originalColor = useRef(colorProp);
  const [color, setColor] = useState(colorProp);

  return (
    <ColorPicker
      value={color}
      onChange={setColor}
      align="center"
      side="bottom"
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
          'h-full w-full cursor-grab overflow-hidden transition-transform duration-150',
          !isDragging && 'hover:z-10 hover:scale-120 hover:shadow',
          isDragging && 'scale-120 cursor-grabbing opacity-75 shadow-lg',
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
});
ColorWithPicker.displayName = 'ColorWithPicker';
