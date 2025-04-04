import React, { useMemo, useRef, useState, useEffect, CSSProperties } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import sampleSize from 'lodash/sampleSize';
import { defaultCellFormat, defaultHeaderFormat } from './helpers';
import { cn } from '@/lib/classMerge';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';

export interface AppDataGridProps {
  className?: string;
  resizable?: boolean;
  draggable?: boolean;
  sortable?: boolean;
  rows: Record<string, string | number | null | Date>[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  headerFormat?: (value: any, columnName: string) => string;
  cellFormat?: (value: any, columnName: string) => string;
  onReorderColumns?: (columnIds: string[]) => void;
  onReady?: () => void;
  onResizeColumns?: (
    columnSizes: {
      key: string;
      size: number;
    }[]
  ) => void;
}

interface SortableHeaderProps {
  header: any; // Header<any, unknown>
  sortable: boolean;
  resizable: boolean;
}
const SortableHeader: React.FC<SortableHeaderProps> = ({ header, sortable, resizable }) => {
  // Set up dnd-kit’s useSortable for this header cell.
  const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({
    id: header.id
  });
  const style: CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform), // translate instead of transform to avoid squishing
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
    boxShadow: isDragging ? '0 0 10px rgba(0, 0, 0, 0.5)' : 'none'
  };

  return (
    <div
      style={style}
      className="relative flex items-center border bg-gray-100 p-2 select-none"
      // onClick toggles sorting if enabled
      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
      <div className="flex-1" ref={setNodeRef} {...attributes} {...listeners}>
        {flexRender(header.column.columnDef.header, header.getContext())}
        {header.column.getIsSorted() === 'asc' && <span> 🔼</span>}
        {header.column.getIsSorted() === 'desc' && <span> 🔽</span>}
      </div>
      {resizable && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}>
          <div
            onMouseDown={header.getResizeHandler()}
            onTouchStart={header.getResizeHandler()}
            className="absolute top-0 right-0 h-full w-2 cursor-col-resize select-none"
          />
        </div>
      )}
    </div>
  );
};

export const AppDataGrid2: React.FC<AppDataGridProps> = React.memo(
  ({
    className = '',
    resizable = true,
    draggable = true,
    sortable = true,
    columnWidths: columnWidthsProp,
    columnOrder: serverColumnOrder,
    onReorderColumns,
    onResizeColumns,
    onReady,
    rows,
    headerFormat = defaultHeaderFormat,
    cellFormat = defaultCellFormat
  }) => {
    // Get a list of fields (each field becomes a column)
    const fields = useMemo(() => {
      return Object.keys(rows[0] || {});
    }, [rows]);

    // (Optional) Use a sample of rows for preview purposes.
    const sampleOfRows = useMemo(() => sampleSize(rows, 15), [rows]);

    // Set up initial states for sorting, column sizing, and column order.
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnSizing, setColumnSizing] = useState(() => {
      const initial: Record<string, number> = {};
      fields.forEach((field) => {
        initial[field] = columnWidthsProp?.[field] || 100;
      });
      return initial;
    });
    const [colOrder, setColOrder] = useState<string[]>(serverColumnOrder || fields);

    // Build columns from fields.
    const columns = useMemo<ColumnDef<any, any>[]>(
      () =>
        fields.map((field) => ({
          id: field,
          accessorKey: field,
          header: () => headerFormat(field, field),
          cell: (info) => cellFormat(info.getValue(), field),
          enableSorting: sortable,
          enableResizing: resizable
        })),
      [fields, headerFormat, cellFormat, sortable, resizable]
    );

    // Create the table instance.
    const table = useReactTable({
      data: rows,
      columns,
      state: {
        sorting,
        columnSizing,
        columnOrder: colOrder
      },
      onSortingChange: setSorting,
      onColumnSizingChange: setColumnSizing,
      onColumnOrderChange: setColOrder,
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      columnResizeMode: 'onChange'
    });

    // Notify when column sizing changes.
    useEffect(() => {
      if (onResizeColumns) {
        const sizes = Object.entries(columnSizing).map(([key, size]) => ({ key, size }));
        onResizeColumns(sizes);
      }
    }, [columnSizing, onResizeColumns]);

    // Call onReady when the table is first set up.
    useEffect(() => {
      if (onReady) onReady();
    }, [onReady]);

    // Set up dnd-kit sensors.
    const sensors = useSensors(
      useSensor(MouseSensor, {
        activationConstraint: {
          distance: 2
        }
      }),
      useSensor(TouchSensor, {
        activationConstraint: {
          distance: 2
        }
      }),
      useSensor(KeyboardSensor)
    );

    // Handle drag end to reorder columns.
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;
      if (active && over && active.id !== over.id) {
        const oldIndex = colOrder.indexOf(active.id as string);
        const newIndex = colOrder.indexOf(over.id as string);
        const newOrder = arrayMove(colOrder, oldIndex, newIndex);
        setColOrder(newOrder);
        if (onReorderColumns) onReorderColumns(newOrder);
      }
    };

    // Set up the virtualizer for infinite scrolling.
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 35, // estimated row height
      overscan: 5
    });

    return (
      <div ref={parentRef} className={cn('h-full w-full overflow-auto', className)}>
        {/* Header */}
        <div className="sticky top-0 z-10 w-full bg-gray-100">
          <DndContext
            sensors={sensors}
            modifiers={[restrictToHorizontalAxis]}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}>
            <SortableContext
              items={table.getHeaderGroups()[0]?.headers.map((header) => header.id) || []}
              strategy={horizontalListSortingStrategy}>
              <div className="flex">
                {table
                  .getHeaderGroups()[0]
                  ?.headers.map((header) => (
                    <SortableHeader
                      key={header.id}
                      header={header}
                      sortable={sortable}
                      resizable={resizable}
                    />
                  ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        {/* Body */}
        <div className="relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = table.getRowModel().rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className="absolute inset-x-0 flex"
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                  height: `${virtualRow.size}px`
                }}>
                {row.getVisibleCells().map((cell) => (
                  <div
                    key={cell.id}
                    className="border p-2"
                    style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

AppDataGrid2.displayName = 'AppDataGrid2';
