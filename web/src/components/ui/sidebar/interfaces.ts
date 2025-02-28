import { BusterRoutes } from '@/routes';
import React from 'react';
export interface ISidebarItem {
  label: string;
  icon: React.ReactNode;
  route: BusterRoutes;
  id: string;
  disabled?: boolean;
  active?: boolean;
  onRemove?: () => void;
}

export interface ISidebarGroup {
  label: string;
  items: ISidebarItem[];
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
