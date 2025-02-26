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
  selected: string[];
  className?: string;
  placeholder?: string;
}

export const SelectTagInput = ({
  items,
  onSelect,
  selected,
  className,
  placeholder = 'Select items...',
  size = 'default',
  variant = 'default'
}: SelectTagInputProps) => {
  const selectedItems = useMemo(
    () => items.filter((item) => selected.includes(item.value)),
    [items, selected]
  );

  const handleRemoveTag = (valueToRemove: string) => {
    const newSelected = selected.filter((value) => value !== valueToRemove);
    onSelect(newSelected);
  };

  const handleSelect = useMemoizedFn((itemId: string) => {
    const item = items.find((item) => item.value === itemId);
    if (item) {
      if (selected.includes(item.value)) {
        handleRemoveTag(item.value);
      } else {
        onSelect([...selected, item.value]);
      }
    }
  });

  return (
    <Dropdown
      items={items}
      onSelect={handleSelect}
      selectType="multiple"
      align="start"
      className="w-[var(--radix-dropdown-menu-trigger-width)]">
      <div className={cn(selectVariants({ variant, size }), className)}>
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <Tag
              key={item.value}
              label={item.label}
              value={item.value}
              onRemove={handleRemoveTag}
            />
          ))}
          {selected.length === 0 && <span className="text-gray-light text-sm">{placeholder}</span>}
        </div>
      </div>
    </Dropdown>
  );
};

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
        'bg-item-hover text-foreground inline-flex h-4 items-center gap-1 rounded-sm border pr-0.5 pl-1.5 text-xs',
        className
      )}>
      <span className="max-w-[80px] truncate">{label}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(value);
        }}
        className="hover:text-foreground-hover hover:bg-item-hover-active pointer-events-auto flex h-3.5 w-3.5 cursor-pointer items-center justify-center rounded-sm focus:outline-none">
        <div className="text-xxs">
          <Xmark />
        </div>
      </button>
    </div>
  );
});
Tag.displayName = 'Tag';
