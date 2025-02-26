import React from 'react';
import {
  Select as SelectBase,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from './SelectBase';

interface SelectItemGroup {
  label: string;
  items: SelectItem[];
}

export interface SelectItem {
  value: string;
  label: string; //this will be used in the select item text
  secondaryLabel?: string;
  icon?: React.ReactNode;
  searchLabel?: string; // Used for filtering
  disabled?: boolean;
  selected?: boolean;
}

export interface SelectProps {
  items: SelectItem[] | SelectItemGroup[];
  disabled?: boolean;
  onSelect?: (value: string) => void;
  placeholder?: string;
  value?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  showIndex?: boolean;
}

export const Select: React.FC<SelectProps> = React.memo(
  ({ items, showIndex, disabled, onSelect, placeholder, value, onOpenChange, open }) => {
    return (
      <SelectBase disabled={disabled} onOpenChange={onOpenChange} open={open}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} defaultValue={value} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item, index) => (
            <SelectItemSelector key={index} item={item} index={index} showIndex={showIndex} />
          ))}
        </SelectContent>
      </SelectBase>
    );
  }
);

Select.displayName = 'Select';

const SelectItemSelector: React.FC<{
  item: SelectItem | SelectItemGroup;
  index: number;
  showIndex?: boolean;
}> = React.memo(({ item, index, showIndex }) => {
  const isGroup = typeof item === 'object' && 'items' in item;

  if (isGroup) {
    const _item = item as SelectItemGroup;
    return (
      <SelectGroup>
        <SelectLabel>{_item.label}</SelectLabel>
        {_item.items?.map((item) => (
          <SelectItemSelector key={item.value} item={item} index={index} showIndex={showIndex} />
        ))}
      </SelectGroup>
    );
  }

  const { value, label, icon, secondaryLabel, disabled, ...rest } = item as SelectItem;

  return (
    <SelectItem
      disabled={disabled}
      value={value}
      icon={icon}
      index={showIndex ? index : undefined}
      secondaryChildren={
        secondaryLabel && <SelectItemSecondaryText>{secondaryLabel}</SelectItemSecondaryText>
      }>
      {label}
    </SelectItem>
  );
});

SelectItemSelector.displayName = 'SelectItemSelector';
const SelectItemSecondaryText: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span className="text-gray-light text-xxs">{children}</span>;
};
