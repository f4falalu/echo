import { Command } from 'cmdk';
import type React from 'react';
import { cn } from '@/lib/utils';
import type { BusterInputDropdownGroup, BusterOnSelectParams } from './BusterInput.types';
import { BusterItemsSelector } from './BusterItemSelector';

export type BusterInputGroupProps = BusterInputDropdownGroup & {
  onSelect: (params: BusterOnSelectParams) => void;
} & {
  className?: string;
  style?: React.CSSProperties;
};

export const BusterInputGroup = ({
  items,
  label,
  onSelect,
  addValueToInput,
  className,
  closeOnSelect,
  style,
}: BusterInputGroupProps) => {
  return (
    <Command.Group
      className={cn(
        'text-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
        className
      )}
      style={style}
      heading={label}
    >
      <BusterItemsSelector
        items={items}
        onSelect={onSelect}
        addValueToInput={addValueToInput}
        closeOnSelect={closeOnSelect}
      />
    </Command.Group>
  );
};
