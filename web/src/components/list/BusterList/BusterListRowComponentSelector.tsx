import React from 'react';
import { BusterListRow, BusterListColumn, BusterListProps } from './interfaces';
import { BusterListSectionComponent } from './BusterListSectionComponent';
import { BusterListRowComponent } from './BusterListRowComponent';

export const BusterListRowComponentSelector = React.forwardRef<
  HTMLDivElement,
  {
    row: BusterListRow;
    columns: BusterListColumn[];
    id: string;
    onSelectChange?: (v: boolean, id: string) => void;
    onSelectSectionChange?: (v: boolean, id: string) => void;
    onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
    selectedRowKeys?: string[];
    rows: BusterListRow[];
    style?: React.CSSProperties;
    columnRowVariant?: BusterListProps['columnRowVariant'];
    useRowClickSelectChange: boolean;
    rowClassName?: string;
  }
>(
  (
    {
      style,
      row,
      rows,
      columns,
      onSelectChange,
      onSelectSectionChange,
      selectedRowKeys,
      onContextMenuClick,
      columnRowVariant,
      rowClassName,
      useRowClickSelectChange = false
    },
    ref
  ) => {
    if (row.rowSection) {
      return (
        <BusterListSectionComponent
          style={style}
          rowSection={row.rowSection}
          ref={ref}
          id={row.id}
          key={row.id}
          rows={rows}
          selectedRowKeys={selectedRowKeys}
          rowClassName={rowClassName}
          onSelectSectionChange={onSelectSectionChange}
        />
      );
    }

    return (
      <BusterListRowComponent
        style={style}
        row={row}
        columns={columns}
        key={row.id}
        rowClassName={rowClassName}
        onSelectChange={onSelectChange}
        checked={!!selectedRowKeys?.includes(row.id)}
        ref={ref}
        onContextMenuClick={onContextMenuClick}
        columnRowVariant={columnRowVariant}
        useRowClickSelectChange={useRowClickSelectChange}
      />
    );
  }
);
BusterListRowComponentSelector.displayName = 'BusterListRowComponent';
