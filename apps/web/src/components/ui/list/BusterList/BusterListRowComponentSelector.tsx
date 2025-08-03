import React from 'react';
import { BusterListRowComponent } from './BusterListRowComponent';
import { BusterListSectionComponent } from './BusterListSectionComponent';
import type { BusterListColumn, BusterListProps, BusterListRow } from './interfaces';

export const BusterListRowComponentSelector = <T = unknown,>() => {
  // const RowComponent = BusterListRowComponent<T>();

  return React.forwardRef<
    HTMLDivElement,
    {
      row: BusterListRow;
      columns: BusterListColumn<T>[];
      id: string;
      onSelectChange?: (v: boolean, id: string, e: React.MouseEvent) => void;
      onSelectSectionChange?: (v: boolean, id: string) => void;
      onContextMenuClick?: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
      selectedRowKeys?: string[];
      rows: BusterListRow[];
      style?: React.CSSProperties;
      hideLastRowBorder: NonNullable<BusterListProps['hideLastRowBorder']>;
      rowClassName?: string;
      isLastChild: boolean;
      useRowClickSelectChange?: boolean;
    }
  >(
    (
      {
        style,
        row,
        rows,
        columns,
        isLastChild,
        onSelectChange,
        onSelectSectionChange,
        selectedRowKeys,
        onContextMenuClick,
        hideLastRowBorder,
        rowClassName,
        useRowClickSelectChange = false
      },
      ref
    ) => {
      if (row.hidden) return null;

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

      const RowComponent = BusterListRowComponent<T>();

      return (
        <RowComponent
          style={style}
          row={row}
          columns={columns}
          key={row.id}
          rowClassName={rowClassName}
          onSelectChange={onSelectChange}
          checked={!!selectedRowKeys?.includes(row.id)}
          ref={ref}
          onContextMenuClick={onContextMenuClick}
          hideLastRowBorder={hideLastRowBorder}
          useRowClickSelectChange={useRowClickSelectChange}
          isLastChild={isLastChild}
        />
      );
    }
  );
};
