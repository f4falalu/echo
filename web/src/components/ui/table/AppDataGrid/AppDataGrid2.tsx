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
  pointerWithin,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useDraggable,
  useDroppable,
  DragOverEvent
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import sampleSize from 'lodash/sampleSize';
import { defaultCellFormat, defaultHeaderFormat } from './helpers';
import { cn } from '@/lib/classMerge';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { useMemoizedFn } from '@/hooks';
import { CaretDown, CaretUp } from '../../icons/NucleoIconFilled';

export interface AppDataGridProps {
  className?: string;
  resizable?: boolean;
  sortable?: boolean;
  rows: Record<string, string | number | null | Date>[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  headerFormat?: (value: string | number | Date | null, columnName: string) => string;
  cellFormat?: (value: string | number | Date | null, columnName: string) => string;
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
  header: Header<Record<string, string | number | Date | null>, unknown>;
  resizable: boolean;
  sortable: boolean;
  overTargetId: string | null;
}

// Constants for consistent sizing
const HEADER_HEIGHT = 36; // 9*4 = 36px (h-9 in Tailwind)

const DraggableHeader: React.FC<DraggableHeaderProps> = React.memo(
  ({ header, sortable, resizable, overTargetId }) => {
    // Set up dnd-kit's useDraggable for this header cell
    const {
      attributes,
      listeners,
      isDragging,
      setNodeRef: setDragNodeRef
    } = useDraggable({
      id: header.id,
      // This ensures the drag overlay matches the element's position exactly
      data: {
        type: 'header'
      }
    });

    // Set up droppable area to detect when a header is over this target
    const { setNodeRef: setDropNodeRef } = useDroppable({
      id: `droppable-${header.id}`
    });

    const isOverTarget = overTargetId === header.id;

    const style: CSSProperties = {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: header.column.getSize(),
      opacity: isDragging ? 0.4 : 1,
      transition: 'none', // Prevent any transitions for snappy changes
      height: `${HEADER_HEIGHT}px` // Set fixed header height
    };

    return (
      <div
        ref={setDropNodeRef}
        style={style}
        className={cn(
          'bg-background relative border select-none',
          isOverTarget && 'bg-primary/10 border-primary rounded-sm border-dashed'
        )}
        // onClick toggles sorting if enabled
        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
        <div
          className="flex h-full flex-1 items-center space-x-1 p-2"
          ref={sortable ? setDragNodeRef : undefined}
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab' }}>
          <span className="text-gray-dark">
            {flexRender(header.column.columnDef.header, header.getContext())}
          </span>
          {header.column.getIsSorted() === 'asc' && (
            <span className="text-icon-color text-xs">
              <CaretUp />
            </span>
          )}
          {header.column.getIsSorted() === 'desc' && (
            <span className="text-icon-color text-xs">
              <CaretDown />
            </span>
          )}
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
              className={cn(
                'hover:bg-primary absolute top-0 -right-[3px] z-10 h-full w-1 cursor-col-resize rounded transition-colors duration-200 select-none',
                header.column.getIsResizing() && 'bg-primary'
              )}
            />
          </div>
        )}
      </div>
    );
  }
);

DraggableHeader.displayName = 'DraggableHeader';

// Header content component to use in the DragOverlay
const HeaderDragOverlay = ({
  header
}: {
  header: Header<Record<string, string | number | Date | null>, unknown>;
}) => {
  return (
    <div
      className="flex items-center rounded border bg-white p-2 shadow-lg"
      style={{
        width: header.column.getSize(),
        height: `${HEADER_HEIGHT}px`,
        opacity: 0.85,
        transform: 'translate3d(0, 0, 0)', // Ensure no unexpected transforms are applied
        pointerEvents: 'none' // Prevent the overlay from intercepting pointer events
      }}>
      {flexRender(header.column.columnDef.header, header.getContext())}
      {header.column.getIsSorted() === 'asc' && <span> 🔼</span>}
      {header.column.getIsSorted() === 'desc' && <span> 🔽</span>}
    </div>
  );
};

export const AppDataGrid2: React.FC<AppDataGridProps> = React.memo(
  ({
    className = '',
    resizable = true,
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
    const [activeHeader, setActiveHeader] = useState<Header<
      Record<string, string | number | Date | null>,
      unknown
    > | null>(null);

    // Build columns from fields.
    const columns = useMemo<
      ColumnDef<Record<string, string | number | Date | null>, string | number | Date | null>[]
    >(
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

    // Reference to the style element for cursor handling
    const styleRef = useRef<HTMLStyleElement | null>(null);

    // Handle drag start to capture the active header
    const handleDragStart = useMemoizedFn((event: DragStartEvent) => {
      const { active } = event;
      setActiveId(active.id as string);

      // Add global cursor style
      const style = document.createElement('style');
      style.innerHTML = `* { cursor: grabbing !important; }`;
      document.head.appendChild(style);
      styleRef.current = style;

      // Find and store the active header for the overlay
      const headerIndex = table
        .getHeaderGroups()[0]
        ?.headers.findIndex((header) => header.id === active.id);

      if (headerIndex !== undefined && headerIndex !== -1) {
        setActiveHeader(table.getHeaderGroups()[0]?.headers[headerIndex]);
      }
    });

    // Handle drag over to highlight the target
    const handleDragOver = useMemoizedFn((event: DragOverEvent) => {
      const { over } = event;
      if (over) {
        // Extract the actual header ID from the droppable ID
        const headerId = over.id.toString().replace('droppable-', '');
        setOverTargetId(headerId);
      } else {
        setOverTargetId(null);
      }
    });

    // Handle drag end to reorder columns.
    const handleDragEnd = useMemoizedFn((event: DragEndEvent) => {
      const { active, over } = event;

      // Remove global cursor style
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }

      // Reset states immediately to prevent animation
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
    });

    // Clean up any styles on unmount
    useEffect(() => {
      return () => {
        // Clean up cursor style if component unmounts during a drag
        if (styleRef.current) {
          document.head.removeChild(styleRef.current);
          styleRef.current = null;
        }
      };
    }, []);

    // Set up the virtualizer for infinite scrolling.
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
      count: table.getRowModel().rows.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 35, // estimated row height
      overscan: 5
    });

    // Create a reference to measure header height
    const headerRef = useRef<HTMLDivElement>(null);
    const [headerHeight, setHeaderHeight] = useState(36); // Default height

    // Measure the actual header height once mounted
    useEffect(() => {
      if (headerRef.current) {
        const height = headerRef.current.getBoundingClientRect().height;
        if (height > 0) {
          setHeaderHeight(height);
        }
      }
    }, []);

    return (
      <div ref={parentRef} className={cn('h-full w-full overflow-auto', className)}>
        {/* Header */}
        <div className="sticky top-0 z-10 w-full bg-gray-100" ref={headerRef}>
          <DndContext
            sensors={sensors}
            modifiers={[restrictToHorizontalAxis]}
            collisionDetection={pointerWithin}
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
                    overTargetId={overTargetId}
                  />
                ))}
            </div>

            {/* Drag Overlay */}
            <DragOverlay
              adjustScale={false}
              dropAnimation={null} // Using null to completely disable animation
              zIndex={1000}>
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
                  <td key={cell.id} className="border p-2" style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
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
