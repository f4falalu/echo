import React from 'react';
import { BusterListRowComponent } from './BusterListRowComponent';
import { BusterListSectionComponent } from './BusterListSectionComponent';
import type { BusterListColumn, BusterListProps, BusterListRowItem } from './interfaces';

interface BusterListRowComponentSelectorProps<T = unknown> {
  row: BusterListRowItem<T>;
  columns: BusterListColumn<T>[];
  id: string;
  onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
  onSelectSectionChange?: (v: boolean, id: string) => void;
  onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  selectedRowKeys?: string[];
  rows: BusterListRowItem[];
  style?: React.CSSProperties;
  hideLastRowBorder: NonNullable<BusterListProps['hideLastRowBorder']>;
  rowClassName?: string;
  isLastChild: boolean;
  useRowClickSelectChange?: boolean;
}

const BusterListRowComponentSelectorInner = React.forwardRef(
  <T,>(
    {
      row,
      isLastChild,
      selectedRowKeys,
      useRowClickSelectChange = false,
      ...rest
    }: BusterListRowComponentSelectorProps<T>,
    ref: React.ForwardedRef<HTMLDivElement>
  ) => {
    if (row.hidden) return null;

    if (row.rowSection) {
      return (
        <BusterListSectionComponent rowSection={row.rowSection} ref={ref} key={row.id} {...rest} />
      );
    }

    return (
      <BusterListRowComponent
        row={row}
        key={row.id}
        checked={!!selectedRowKeys?.includes(row.id)}
        ref={ref}
        useRowClickSelectChange={useRowClickSelectChange}
        isLastChild={isLastChild}
        {...rest}
      />
    );
  }
);

BusterListRowComponentSelectorInner.displayName = 'BusterListRowComponentSelectorInner';

// Type assertion through unknown is safer than any
export const BusterListRowComponentSelector = BusterListRowComponentSelectorInner as (<T>(
  props: BusterListRowComponentSelectorProps<T> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null) & { displayName?: string };

BusterListRowComponentSelector.displayName = 'BusterListRowComponentSelector';
