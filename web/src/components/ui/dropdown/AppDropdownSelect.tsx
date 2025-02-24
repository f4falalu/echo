import React from 'react';
import { AppPopoverMenu, AppPopoverMenuProps } from '../tooltip';

export interface AppDropdownSelectProps extends AppPopoverMenuProps {
  items: {
    label: React.ReactNode;
    key?: string;
    index?: number;
    onClick?: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    link?: string;
  }[];
}

export const AppDropdownSelect: React.FC<AppDropdownSelectProps> = React.memo((props) => {
  return <AppPopoverMenu {...props} />;
});

AppDropdownSelect.displayName = 'AppDropdownSelect';
