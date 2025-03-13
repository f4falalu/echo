import React from 'react';

export interface ISidebarItem {
  label: string;
  icon?: React.ReactNode;
  route: string | null;
  id: string;
  disabled?: boolean;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

export interface ISidebarGroup {
  label: string;
  icon?: React.ReactNode;
  items: ISidebarItem[];
  variant?: 'collapsible' | 'icon'; //default is collapsible
  defaultOpen?: boolean; //will default to true
}

export interface ISidebarList {
  items: ISidebarItem[];
}

type SidebarContent = ISidebarGroup | ISidebarList;

export interface SidebarProps {
  header: React.ReactNode;
  content: SidebarContent[];
  footer?: React.ReactNode;
  activeItem: string;
}
