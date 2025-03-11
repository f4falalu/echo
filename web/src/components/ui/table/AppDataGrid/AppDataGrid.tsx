'use client';

import { DataGrid } from 'react-data-grid';
import type {
  Column,
  CalculatedColumn,
  CopyEvent,
  RenderCellProps,
  RenderHeaderCellProps,
  SortColumn
} from 'react-data-grid';
import isNumber from 'lodash/isNumber';
import isDate from 'lodash/isDate';
import isString from 'lodash/isString';
import { Text } from '@/components/ui/typography';
import round from 'lodash/round';
import { ErrorBoundary } from '@/components/ui/error';
import { CaretDown } from '../../icons/NucleoIconFilled';

//https://www.npmjs.com/package/react-spreadsheet-grid#live-playground
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  useDebounce,
  useDebounceEffect,
  useDebounceFn,
  useMemoizedFn,
  useMount,
  useSize
} from '@/hooks';
import sampleSize from 'lodash/sampleSize';
import isEmpty from 'lodash/isEmpty';
import {
  createInitialColumnWidths,
  defaultCellFormat,
  defaultHeaderFormat,
  MIN_WIDTH
} from './helpers';

type Row = Record<string, string | number | null | Date>;

const DEFAULT_COLUMN_WIDTH = {
  width: '1fr',
  minWidth: MIN_WIDTH
  //  maxWidth: columnsOrder.length <= 2 ? undefined : MAX_WIDTH
};

export interface AppDataGridProps {
  initialWidth?: number;
  animate?: boolean;
  resizable?: boolean;
  draggable?: boolean;
  sortable?: boolean;
  rows: Record<string, string | number | null | Date>[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  headerFormat?: (value: any, columnName: string) => string;
  cellFormat?: (value: any, columnName: string) => string;
  onReorderColumns?: (columns: string[]) => void;
  onReady?: () => void;
  onResizeColumns?: (
    columnSizes: {
      key: string;
      size: number;
    }[]
  ) => void;
}

export const AppDataGrid: React.FC<AppDataGridProps> = React.memo(
  ({
    resizable = true,
    draggable = true,
    sortable = true,
    animate = true,
    columnWidths: columnWidthsProp,
    columnOrder: serverColumnOrder,
    onReorderColumns,
    onResizeColumns,
    onReady,
    rows,
    headerFormat = defaultHeaderFormat,
    cellFormat = defaultCellFormat,
    initialWidth
  }) => {
    const [forceRenderId, setForceRenderId] = useState(1);
    const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);

    const hasErroredOnce = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const widthOfContainer = useDebounce(useSize(containerRef)?.width ?? initialWidth, {
      wait: 25,
      maxWait: 500,
      leading: true
    });

    const sampleOfRows = useMemo(() => sampleSize(rows, 15), [rows]);
    const fields = useMemo(() => {
      const newFields = Object.keys(rows[0] || {});
      return newFields;
    }, [rows]);

    const onCreateInitialColumnWidths = useMemoizedFn(() => {
      const res = createInitialColumnWidths(
        fields,
        sampleOfRows,
        headerFormat,
        cellFormat,
        columnWidthsProp,
        widthOfContainer,
        serverColumnOrder
      );
      return res;
    });

    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
      onCreateInitialColumnWidths()
    );
    const canRenderGrid = rows.length > 0 && !isEmpty(columnWidths);

    const memoizedRenderHeaderCell = useMemoizedFn((v: RenderHeaderCellProps<Row, unknown>) => (
      <HeaderCell {...v} headerFormat={headerFormat} />
    ));

    const memoizedRenderCell = useMemoizedFn((v: RenderCellProps<Row, unknown>) => (
      <GridCell {...v} cellFormat={cellFormat} />
    ));

    const columnsBase: Column<Row>[] = useMemo(() => {
      if (!canRenderGrid) return [];
      return fields.map((key) => ({
        key,
        name: key,
        resizable,
        sortable,
        draggable,
        renderHeaderCell: memoizedRenderHeaderCell,
        renderCell: memoizedRenderCell
      }));
      //header and cell format are needed for the grid to render
    }, [draggable, fields, resizable, cellFormat, headerFormat]);

    const columns = useMemo(() => {
      return columnsBase.map((column) => ({
        ...column,
        width: columnWidths[column.key]
      }));
    }, [columnsBase, columnWidths]);

    const [columnsOrder, setColumnsOrder] = useState((): number[] =>
      columns.map((_, index) => index)
    );

    const reorderedColumns = useMemo(
      () => columnsOrder.map((index) => columns[index]).filter(Boolean), //for the love of all things holy don't remove this filter. It is need to prevent everything from blowing up 💥🔥💣⚡🌪️💨💀🎇🌋🌀
      [columns, columnsOrder]
    );

    const sortedRows = useMemo((): Row[] => {
      if (sortColumns.length === 0) return rows;
      const { columnKey, direction } = sortColumns[0];
      let sortedRows: Row[] = [...rows];

      if (isNumber(rows[0][columnKey])) {
        sortedRows = sortedRows.sort((a, b) => (a[columnKey] as number) - (b[columnKey] as number));
      } else if (isDate(rows[0][columnKey])) {
        sortedRows = sortedRows.sort(
          (a, b) => (a[columnKey] as Date).getTime() - (b[columnKey] as Date).getTime()
        );
      } else if (isString(rows[0][columnKey])) {
        sortedRows = sortedRows.sort((a, b) =>
          String(a[columnKey]).localeCompare(String(b[columnKey]))
        );
      }

      return direction === 'DESC' ? sortedRows.reverse() : sortedRows;
    }, [rows, sortColumns]);

    const onSortColumnsChange = useMemoizedFn((sortColumns: SortColumn[]) => {
      setSortColumns(sortColumns.slice(-1));
    });

    const onColumnsReorder = useMemoizedFn((sourceKey: string, targetKey: string) => {
      setColumnsOrder((columnsOrder) => {
        const sourceColumnOrderIndex = columnsOrder.findIndex(
          (index) => columns[index].key === sourceKey
        );
        const targetColumnOrderIndex = columnsOrder.findIndex(
          (index) => columns[index].key === targetKey
        );
        const sourceColumnOrder = columnsOrder[sourceColumnOrderIndex];
        const newColumnsOrder = columnsOrder.toSpliced(sourceColumnOrderIndex, 1);
        newColumnsOrder.splice(targetColumnOrderIndex, 0, sourceColumnOrder);
        onReorderColumns?.(newColumnsOrder.map((index) => columns[index].key));
        return newColumnsOrder;
      });
    });

    const handleCopy = useMemoizedFn(({ sourceRow, sourceColumnKey }: CopyEvent<Row>): void => {
      if (window.isSecureContext) {
        if (sourceRow[sourceColumnKey as keyof Row] === null) return;
        const stringifiedValue = String(sourceRow[sourceColumnKey as keyof Row]);
        navigator.clipboard.writeText(stringifiedValue);
      }
    });

    const onColumnResize = useMemoizedFn(
      (column: CalculatedColumn<Row, unknown>, width: number) => {
        const index = columns.findIndex((c) => c.key === column.key);
        const newSizes = columns.reduce<Record<string, number>>((acc, column, i) => {
          if (!column.key) return acc;

          acc[column.key] = i === index ? round(width) : (column.width as number);
          return acc;
        }, {});
        const columnArray = columns
          .map((column) => ({
            key: column.key,
            size: newSizes[column.key]
          }))
          .sort(
            (a, b) =>
              columnsOrder.indexOf(columns.findIndex((c) => c.key === a.key)) -
              columnsOrder.indexOf(columns.findIndex((c) => c.key === b.key))
          );

        onResizeColumnsDebounce(columnArray);
        onColumnResizeDebounce();
      }
    );

    const { run: onResizeColumnsDebounce } = useDebounceFn(
      (columnArray: { key: string; size: number }[]) => {
        onResizeColumns?.(columnArray);
      },
      { wait: 300 }
    );

    const onColumnResizeOverflowCheck = useMemoizedFn(() => {
      if (widthOfContainer) {
        const gridElement = containerRef.current
          ?.querySelector('.rdg-header-row')
          ?.querySelectorAll('.rdg-cell');
        let widthOfGrid = 0;
        gridElement?.forEach((element) => {
          widthOfGrid += element?.clientWidth || 0;
        });

        if (gridElement && widthOfGrid && widthOfGrid < widthOfContainer) {
          const actualWidths = reorderedColumns.reduce<Record<string, number>>((acc, column, i) => {
            if (!column.key) return acc;
            acc[column.key] = gridElement[i]?.clientWidth || 0;
            return acc;
          }, {});

          const newSizes = { ...actualWidths };
          const lastColumn = reorderedColumns[reorderedColumns.length - 1];
          if (lastColumn?.key) {
            const lastElementWidth = gridElement[reorderedColumns.length - 1]?.clientWidth || 0;
            newSizes[lastColumn.key] = widthOfContainer - widthOfGrid + lastElementWidth;
          }
          const hasSignificantChanges = Object.entries(newSizes).some(([key, newSize]) => {
            const currentSize = columnWidths[key];
            return !currentSize || Math.abs(newSize - currentSize) > 2;
          });

          const actualWidthTotal = Object.values(actualWidths).reduce(
            (sum, width) => sum + width,
            0
          );
          const isActualWidthLessThanGrid = Math.abs(actualWidthTotal - widthOfContainer) >= 3;

          if (!hasSignificantChanges && !isActualWidthLessThanGrid) {
            return;
          }

          setForceRenderId((prev) => prev + 1);

          setColumnWidths(() => {
            return newSizes;
          });

          const newColumnArray = columns
            .map((column) => ({
              key: column.key,
              size: newSizes[column.key]
            }))
            .sort(
              (a, b) =>
                columnsOrder.indexOf(columns.findIndex((c) => c.key === a.key)) -
                columnsOrder.indexOf(columns.findIndex((c) => c.key === b.key))
            );
          onResizeColumnsDebounce?.(newColumnArray);

          return;
        }
      }
    });

    const { run: onColumnResizeDebounce } = useDebounceFn(onColumnResizeOverflowCheck, {
      wait: 350
    });

    const handleErrorBoundary = useMemoizedFn(() => {
      if (!hasErroredOnce.current) {
        setForceRenderId((prev) => prev + 1);
        hasErroredOnce.current = true;
      }
    });

    useLayoutEffect(() => {
      if (rows.length === 0 || fields.length === 0) return;

      // Reset columns order and widths when fields change
      if (widthOfContainer) {
        const initialColumnWidths = onCreateInitialColumnWidths();
        const isDifferentInitialColumnWidths =
          JSON.stringify(initialColumnWidths) !== JSON.stringify(columnWidths);
        if (isDifferentInitialColumnWidths) setColumnWidths(initialColumnWidths);
        const newColumnsOrder = columns.map((_, index) => index);
        const isDifferentColumnsOrder =
          JSON.stringify(newColumnsOrder) !== JSON.stringify(columnsOrder);
        if (isDifferentColumnsOrder) setColumnsOrder(newColumnsOrder);
      }
    }, [rows, fields]);

    useDebounceEffect(
      () => {
        onColumnResizeOverflowCheck();
      },
      [widthOfContainer],
      { wait: 100 }
    );

    useMount(() => {
      requestAnimationFrame(() => {
        onReady?.();
        onColumnResizeOverflowCheck();
      });
    });

    const columnsX = [
      { key: 'id', name: 'ID' },
      { key: 'title', name: 'Title' }
    ];

    const rowsX = [
      { id: 0, title: 'Example' },
      { id: 1, title: 'Demo' }
    ];

    console.log('columnsX', columnsX);
    console.log('rowsX', rowsX);

    return (
      <React.Fragment key={forceRenderId}>
        <ErrorBoundary onError={handleErrorBoundary}>
          <div
            ref={containerRef}
            className={'bg-background flex h-full w-full flex-col'}
            style={{
              transition: animate ? 'opacity 0.25s' : undefined
            }}>
            <DataGrid columns={columnsX} rows={rowsX} />

            {/* <DataGrid
              className={styles.dataGrid}
              columns={reorderedColumns}
              rows={sortedRows}
              sortColumns={sortColumns}
              onSortColumnsChange={onSortColumnsChange}
              headerRowHeight={36}
              rowHeight={36}
              enableVirtualization={rows.length > 60}
              onCopy={handleCopy}
              onColumnResize={onColumnResize}
              // onColumnResize={onColumnResize}
              onColumnsReorder={onColumnsReorder}
              defaultColumnOptions={DEFAULT_COLUMN_WIDTH}
              direction={'ltr'}
            /> */}
            <div style={{ width: '100%' }}></div>
          </div>
        </ErrorBoundary>
      </React.Fragment>
    );
  },
  (prevProps, nextProps) => {
    const keysToCheck: (keyof AppDataGridProps)[] = [
      'cellFormat',
      'headerFormat',
      'columnOrder',
      'resizable',
      'draggable',
      'rows'
    ];
    return keysToCheck.every((key) => prevProps[key] === nextProps[key]);
  }
);
AppDataGrid.displayName = 'AppDataGrid';

const HeaderCell: React.FC<
  RenderHeaderCellProps<Row, unknown> & {
    headerFormat: (value: any, columnName: string) => string;
  }
> = React.memo(({ column, headerFormat, sortDirection, ...rest }) => {
  const { name, sortable, key } = column;
  return (
    <div className="flex items-center overflow-hidden">
      <Text className="block!" truncate>
        {headerFormat(name, key)}
      </Text>
      {sortable && sortDirection && (
        <div
          className="text-icon-color text-xs transition"
          style={{
            transform: `rotate(${sortDirection === 'ASC' ? 0 : 180}deg)`
          }}>
          <CaretDown />
        </div>
      )}
    </div>
  );
});
HeaderCell.displayName = 'HeaderCell';

const GridCell: React.FC<
  RenderCellProps<Row, unknown> & {
    cellFormat: (value: any, columnName: string) => string;
  }
> = React.memo(({ row, column, cellFormat }) => {
  let value = row[column.key];
  if (typeof value === 'object' && value !== null) {
    value = JSON.stringify(value);
  }
  return cellFormat(value, column.key);
});
GridCell.displayName = 'GridCell';

export default AppDataGrid;
