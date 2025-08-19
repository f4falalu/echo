import type {
  ActiveOptions,
  LinkProps,
  RegisteredRouter,
  ValidateLinkOptions,
} from '@tanstack/react-router';
import type React from 'react';
import type { LinkOptionsTo, OptionsTo } from '@/types/routes';

// Base properties shared by all sidebar items
type ISidebarItemBase = {
  label: string;
  icon?: React.ReactNode;
  id: string;
  disabled?: boolean;
  active?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  collapsedTooltip?: string;
};

// Discriminated union: either has a route (with optional activeOptions) or no route at all
export type ISidebarItem<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
> = ISidebarItemBase &
  (
    | {
        route: LinkOptionsTo;
      }
    | {
        route?: never;
      }
  );

// Extract only the route variant of ISidebarItem (useful for components that require a route)
export type ISidebarItemWithRoute = ISidebarItemBase & {
  route: OptionsTo;
  preload?: LinkProps['preload'];
  preloadDelay?: LinkProps['preloadDelay'];
  activeOptions?: LinkProps['activeOptions'];
};

export interface ISidebarGroup {
  label: string;
  icon?: React.ReactNode;
  id: string;
  items: ISidebarItem[];
  variant?: 'collapsible' | 'icon'; //default is collapsible
  defaultOpen?: boolean; //will default to true
  isSortable?: boolean;
  onItemsReorder?: (ids: string[]) => void;
  triggerClassName?: string;
  className?: string;
}

export interface ISidebarList {
  items: ISidebarItem[];
  id: string;
}

type SidebarContent = ISidebarGroup | ISidebarList;

export interface SidebarProps {
  header: React.ReactNode;
  content: SidebarContent[];
  footer?: React.ReactNode;
  isSortable?: boolean;
  useCollapsible?: boolean;
  onCollapseClick?: (value: boolean) => void;
}
