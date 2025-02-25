import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from './DropdownBase';
import { cn } from '@/lib/classMerge';

export interface SearchDropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  selected?: boolean;
}

interface SearchDropdownProps {
  items: SearchDropdownItem[];
  onSelect: (item: SearchDropdownItem) => void;
  className?: string;
  style?: React.CSSProperties;
  open: boolean;
  children: React.ReactNode;
}

export const SearchDropdown = React.memo(
  ({ items, onSelect, className, children, open }: SearchDropdownProps) => {
    return (
      <DropdownMenu open={open} defaultOpen={open} modal={false}>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>

        <DropdownMenuContent
          className={cn(
            'w-full min-w-[var(--radix-popper-anchor-width)]',
            'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100',
            'rounded-t-none',
            className
          )}
          sideOffset={0}
          align={'center'}
          side={'bottom'}
          loop>
          {items.map((item, index) => (
            <DropdownMenuItem
              disabled={item.disabled}
              key={index}
              className="min-h-10"
              onClick={() => onSelect(item)}>
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);

SearchDropdown.displayName = 'SearchDropdown';
