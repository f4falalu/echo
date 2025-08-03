import type React from 'react';
import type { ContextMenuProps } from '../../context-menu/ContextMenu';
export interface BusterListProps<T = any> {
  columns: BusterListColumn<T>[];
  hideLastRowBorder?: boolean;
  rows: BusterListRow[];
  onSelectChange?: (selectedRowKeys: string[]) => void;
  emptyState?: undefined | React.ReactNode | string;
  showHeader?: boolean;
  selectedRowKeys?: string[];
  contextMenu?: ContextMenuProps;
  showSelectAll?: boolean;
  useRowClickSelectChange?: boolean;
  rowClassName?: string;
}

export interface BusterListColumn<T = any> {
  dataIndex: keyof T;
  title: string;
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right'; //TODO
  render?: (value: T[keyof T], record: T) => React.JSX.Element | string | React.ReactNode;
  headerRender?: (title: string) => React.ReactNode;
  ellipsis?: boolean;
}

export type BusterListRow = BusterListRowItem;
export interface BusterListRowItem {
  id: string;
  data: Record<
    string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- This really could be anything...
    string | React.ReactNode | number | boolean | null | undefined | object | any
  > | null;
  onClick?: () => void;
  link?: string;
  onSelect?: () => void;
  rowSection?: BusterListSectionRow;
  hidden?: boolean;
  dataTestId?: string;
}

export interface BusterListSectionRow {
  title: string;
  secondaryTitle?: string;
  disableSection?: boolean;
}
