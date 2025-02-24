import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuPortal
} from './DropdownBase';
import { useMemoizedFn } from 'ahooks';

export interface DropdownItem {
  label: React.ReactNode;
  id: string;
  index?: number;
  shortcut?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  link?: string;
  loading?: boolean;
  selected?: boolean;
  items?: DropdownItem[];
}

export interface ButtonDropdownProps extends DropdownMenuProps {
  items?: DropdownItem[];
  selectType?: 'default' | 'single' | 'multiple';
  menuLabel?: string | React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  closeOnSelect?: boolean;
  onSelect?: (item: DropdownItem) => void;
}

export const Dropdown: React.FC<ButtonDropdownProps> = ({
  items = [],
  selectType = 'default',
  menuLabel,
  minWidth = 200,
  maxWidth,
  closeOnSelect = true,
  onSelect,
  children,
  ...props
}) => {
  const renderItems = (items: DropdownItem[]) => {
    return items.map((item) => {
      if (item.items) {
        return (
          <DropdownMenuSub key={item.id}>
            <DropdownMenuTrigger>
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span>{item.label}</span>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent>{renderItems(item.items)}</DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        );
      }

      return (
        <DropdownMenuItem
          key={item.id}
          disabled={item.disabled}
          onClick={() => {
            if (item.onClick) item.onClick();
            if (onSelect) onSelect(item);
          }}>
          {item.icon && <span className="mr-2">{item.icon}</span>}
          <span>{item.label}</span>
          {item.shortcut && (
            <span className="ml-auto text-xs tracking-widest opacity-60">{item.shortcut}</span>
          )}
        </DropdownMenuItem>
      );
    });
  };

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        style={{
          minWidth: minWidth,
          maxWidth: maxWidth
        }}>
        {menuLabel && <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>}
        {menuLabel && <DropdownMenuSeparator />}
        {renderItems(items)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
