import { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';
import React from 'react';

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
  onClose?: () => void;
  onOpen?: () => void;
}
