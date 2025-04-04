import React, { useMemo, useRef, useState, useEffect, CSSProperties } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  Header
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
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
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

interface DraggableHeaderProps {
  header: any; // Header<any, unknown>
  sortable: boolean;
  resizable: boolean;
  isOverTarget: boolean;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = ({
  header,
  sortable,
  resizable,
  isOverTarget
}) => {
  // Set up dnd-kit's useDraggable for this header cell
  const {
    attributes,
    listeners,
    isDragging,
    setNodeRef: setDragNodeRef
  } = useDraggable({
    id: header.id
  });

  // Set up droppable area to detect when a header is over this target
  const { setNodeRef: setDropNodeRef } = useDroppable({
    id: `droppable-${header.id}`
  });

  const style: CSSProperties = {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    opacity: isDragging ? 0.4 : 1
  };

  return (
    <div
      ref={setDropNodeRef}
      style={style}
      className={cn(
        'relative flex items-center border bg-gray-100 p-2 select-none',
        isOverTarget && 'border-dashed border-blue-500 bg-blue-50'
      )}
      // onClick toggles sorting if enabled
      onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
      <div
        className="flex-1"
        ref={setDragNodeRef}
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab' }}>
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

// Header content component to use in the DragOverlay
const HeaderDragOverlay = ({ header }: { header: Header<any, unknown> }) => {
  return (
    <div
      className="rounded border bg-white p-2 shadow-lg"
      style={{
        width: header.column.getSize(),
        opacity: 0.9
      }}>
      {flexRender(header.column.columnDef.header, header.getContext())}
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

    // Track active drag item and over target
    const [activeId, setActiveId] = useState<string | null>(null);
    const [overTargetId, setOverTargetId] = useState<string | null>(null);

    // Store active header for overlay rendering
    const [activeHeader, setActiveHeader] = useState<any>(null);

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

    // Handle drag start to capture the active header
    const handleDragStart = (event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);

      // Find and store the active header for the overlay
      const headerIndex = table
        .getHeaderGroups()[0]
        ?.headers.findIndex((header) => header.id === active.id);

      if (headerIndex !== undefined && headerIndex !== -1) {
        setActiveHeader(table.getHeaderGroups()[0]?.headers[headerIndex]);
      }
    };

    // Handle drag over to highlight the target
    const handleDragOver = (event: DragOverEvent) => {
      const { over } = event;
      if (over) {
        // Extract the actual header ID from the droppable ID
        const headerId = over.id.toString().replace('droppable-', '');
        setOverTargetId(headerId);
      } else {
        setOverTargetId(null);
      }
    };

    // Handle drag end to reorder columns.
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      // Reset states
      setActiveId(null);
      setActiveHeader(null);
      setOverTargetId(null);

      if (active && over) {
        // Extract the actual header ID from the droppable ID
        const overId = over.id.toString().replace('droppable-', '');

        if (active.id !== overId) {
          const oldIndex = colOrder.indexOf(active.id as string);
          const newIndex = colOrder.indexOf(overId);
          const newOrder = arrayMove(colOrder, oldIndex, newIndex);
          setColOrder(newOrder);
          if (onReorderColumns) onReorderColumns(newOrder);
        }
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
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}>
            <div className="flex">
              {table
                .getHeaderGroups()[0]
                ?.headers.map((header) => (
                  <DraggableHeader
                    key={header.id}
                    header={header}
                    sortable={sortable}
                    resizable={resizable}
                    isOverTarget={header.id === overTargetId}
                  />
                ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay adjustScale={false}>
              {activeId && activeHeader && <HeaderDragOverlay header={activeHeader} />}
            </DragOverlay>
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
