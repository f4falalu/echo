import type { LinkProps } from '@tanstack/react-router';
import type React from 'react';
import type { OptionsTo } from '@/types/routes';
import type { ContextMenuProps } from '../../context-menu/ContextMenu';

export interface BusterListProps<T = unknown> {
  columns: BusterListColumn<T>[];
  hideLastRowBorder?: boolean;
  rows: BusterListRowItem<T>[];
  onSelectChange?: (selectedRowKeys: string[]) => void;
  emptyState?: undefined | React.ReactNode | string;
  showHeader?: boolean;
  selectedRowKeys?: string[];
  contextMenu?: ContextMenuProps;
  showSelectAll?: boolean;
  useRowClickSelectChange?: boolean;
  rowClassName?: string;
  className?: string;
}

export type BusterListColumn<T = unknown> = {
  [K in keyof T]: {
    dataIndex: K;
    title: string;
    width?: number;
    minWidth?: number;
    align?: 'left' | 'center' | 'right';
    render?: (value: T[K], record: T) => React.JSX.Element | string | React.ReactNode;
    headerRender?: (title: string) => React.ReactNode;
    ellipsis?: boolean;
  };
}[keyof T];

type BusterListRowLink = {
  link: OptionsTo;
  preloadDelay?: LinkProps['preloadDelay'];
  preload?: LinkProps['preload'];
};

type BusterListRowNotLink = {
  link?: never;
};

export type BusterListRowItem<T = unknown> = {
  id: string;
  data: T | null;
  onClick?: () => void;
  onSelect?: () => void;
  rowSection?: BusterListSectionRow;
  hidden?: boolean;
  dataTestId?: string;
} & (BusterListRowLink | BusterListRowNotLink);

export interface BusterListSectionRow {
  title: string;
  secondaryTitle?: string;
  disableSection?: boolean;
}
