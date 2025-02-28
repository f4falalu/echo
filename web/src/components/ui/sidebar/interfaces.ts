import { BusterRoutes } from '@/routes';

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
