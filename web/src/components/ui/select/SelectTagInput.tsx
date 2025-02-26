'use client';

import React from 'react';
import { type SelectItem } from './Select';
import { selectVariants } from './SelectBase';
import { cn } from '@/lib/classMerge';
import { Xmark } from '../icons/NucleoIconOutlined';
import { Dropdown } from '../dropdown/Dropdown';
import { VariantProps } from 'class-variance-authority';

interface TagProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

interface SelectTagInputProps extends VariantProps<typeof selectVariants> {
  items: SelectItem[];
  onSelect: (item: SelectItem[]) => void;
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
  const selectedItems = items.filter((item) => selected.includes(item.value));

  const handleRemoveTag = (valueToRemove: string) => {
    const newSelected = selected.filter((value) => value !== valueToRemove);
    onSelect(items.filter((item) => newSelected.includes(item.value)));
  };

  return (
    <Dropdown items={items} selectType="multiple" align="start">
      <div className={cn(selectVariants({ variant, size }), className)}>
        <div className="flex flex-wrap gap-1">
          {selectedItems.map((item) => (
            <Tag key={item.value} label={item.label} onRemove={() => handleRemoveTag(item.value)} />
          ))}
          {selected.length === 0 && <span className="text-gray-light text-sm">{placeholder}</span>}
        </div>
      </div>
    </Dropdown>
  );
};

const Tag = ({ label, onRemove, className }: TagProps) => {
  return (
    <div
      className={cn(
        'bg-item-hover text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs',
        className
      )}>
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="hover:text-foreground-hover focus:outline-none">
        <div className="text-sm">
          <Xmark />
        </div>
      </button>
    </div>
  );
};
