'use client';

import React, { useMemo } from 'react';
import { type SelectItem } from './Select';
import { selectVariants } from './SelectBase';
import { cn } from '@/lib/classMerge';
import { Xmark } from '../icons/NucleoIconOutlined';
import { Dropdown } from '../dropdown/Dropdown';
import { VariantProps } from 'class-variance-authority';
import { useMemoizedFn } from 'ahooks';

interface SelectTagInputProps extends VariantProps<typeof selectVariants> {
  items: SelectItem[];
  onSelect: (item: string[]) => void;
  className?: string;
  placeholder?: string;
}

export const SelectTagInput: React.FC<SelectTagInputProps> = React.memo(
  ({
    items,
    onSelect,
    className,
    placeholder = 'Select items...',
    size = 'default',
    variant = 'default'
  }) => {
    const handleRemoveTag = (valueToRemove: string) => {
      const newSelected = items
        .filter((item) => item.value !== valueToRemove && item.selected)
        .map((item) => item.value);
      onSelect(newSelected);
    };

    const handleSelect = useMemoizedFn((itemId: string) => {
      const item = items.find((item) => item.value === itemId);
      if (item) {
        if (item.selected) {
          handleRemoveTag(item.value);
        } else {
          const newSelected = items.filter((item) => item.selected).map((item) => item.value);
          onSelect([...newSelected, item.value]);
        }
      }
    });

    const selectedItems = useMemo(() => {
      return items.filter((item) => item.selected);
    }, [items]);

    return (
      <Dropdown
        items={items}
        onSelect={handleSelect}
        selectType="multiple"
        align="start"
        className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <div
          className={cn(
            selectVariants({ variant, size }),
            'relative overflow-hidden pr-0',
            className
          )}>
          <div className="scrollbar-hide flex flex-nowrap gap-1 overflow-x-auto">
            {selectedItems.map((item) => (
              <Tag
                key={item.value}
                label={item.label}
                value={item.value}
                onRemove={handleRemoveTag}
              />
            ))}
            {selectedItems.length === 0 && (
              <span className="text-gray-light text-sm">{placeholder}</span>
            )}
          </div>
          {selectedItems.length > 0 && (
            <div className="from-background via-background/80 pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l to-transparent" />
          )}
        </div>
      </Dropdown>
    );
  }
);
SelectTagInput.displayName = 'SelectTagInput';

const Tag: React.FC<{
  label: string;
  value: string;
  onRemove: (valueToRemove: string) => void;
  className?: string;
}> = React.memo(({ label, value, onRemove, className }) => {
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn(
        'bg-item-hover text-foreground inline-flex h-4 flex-shrink-0 items-center gap-1 rounded-sm border pr-0.5 pl-1.5 text-xs',
        className
      )}>
      <span className="max-w-[80px] truncate">{label}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(value);
        }}
        className="hover:text-foreground text-icon-color hover:bg-item-hover-active pointer-events-auto flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-sm focus:outline-none">
        <div className="text2xs">
          <Xmark />
        </div>
      </button>
    </div>
  );
});
Tag.displayName = 'Tag';
