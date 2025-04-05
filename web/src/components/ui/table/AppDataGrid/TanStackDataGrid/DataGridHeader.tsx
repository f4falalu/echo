import React, { CSSProperties } from 'react';
import { DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Header, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/classMerge';
import { CaretDown, CaretUp } from '../../../icons/NucleoIconFilled';
import { HEADER_HEIGHT } from './constants';
import { useSortColumnContext } from './SortColumnWrapper';
import { Virtualizer } from '@tanstack/react-virtual';

interface DraggableHeaderProps {
  header: Header<Record<string, string | number | Date | null>, unknown>;
  resizable: boolean;
  sortable: boolean;
  isOverTarget: boolean;
}

const DraggableHeader: React.FC<DraggableHeaderProps> = React.memo(
  ({ header, sortable, resizable, isOverTarget }) => {
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

    const style: CSSProperties = {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: header.column.getSize(),
      opacity: isDragging ? 0.65 : 1,
      transition: 'none', // Prevent any transitions for snappy changes
      height: `${HEADER_HEIGHT}px` // Set fixed header height
    };

    return (
      <th
        ref={setDropNodeRef}
        style={style}
        className={cn(
          'group bg-background relative border-r select-none last:border-r-0',
          header.column.getIsResizing() ? 'bg-primary/10' : 'hover:bg-item-hover',
          isOverTarget && 'bg-primary/10 border-primary inset border border-r! border-dashed'
        )}
        // onClick toggles sorting if enabled
        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
        <span
          className={cn(
            'flex h-full flex-1 items-center space-x-1.5 p-2',
            sortable && 'cursor-grab'
          )}
          ref={sortable ? setDragNodeRef : undefined}
          {...attributes}
          {...listeners}>
          <span className="text-gray-dark text-base font-normal">
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
        </span>
        {resizable && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}>
            {/* <span
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={cn(
                'hover:bg-primary group-hover:bg-border absolute top-0 -right-[2.5px] z-10 h-full w-1 cursor-col-resize transition-colors duration-100 select-none hover:w-1',
                header.column.getIsResizing() && 'bg-primary'
              )}
            /> */}

            <span
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={cn(
                'group-hover:bg-border hover:bg-primary absolute inset-y-0 -right-0.5 z-10 w-1 cursor-col-resize transition-colors duration-100 select-none',
                header.column.getIsResizing() && 'bg-primary'
              )}
            />
          </span>
        )}
      </th>
    );
  }
);

DraggableHeader.displayName = 'DraggableHeader';

interface DataGridHeaderProps {
  table: Table<Record<string, string | number | Date | null>>;
  sortable: boolean;
  resizable: boolean;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
}

export const DataGridHeader: React.FC<DataGridHeaderProps> = ({
  rowVirtualizer,
  table,
  sortable,
  resizable
}) => {
  const overTargetId = useSortColumnContext((x) => x.overTargetId);

  const showScrollShadow = (rowVirtualizer?.scrollOffset || 0) > 10;

  return (
    <>
      <thead className="bg-background sticky top-0 z-10 w-full" suppressHydrationWarning>
        <tr
          className={cn(
            'flex border-b transition-all duration-200',
            showScrollShadow && 'shadow-sm'
          )}>
          {table
            .getHeaderGroups()[0]
            ?.headers.map(
              (header: Header<Record<string, string | number | Date | null>, unknown>) => (
                <DraggableHeader
                  key={header.id}
                  header={header}
                  sortable={sortable}
                  resizable={resizable}
                  isOverTarget={overTargetId === header.id}
                />
              )
            )}
        </tr>
      </thead>
    </>
  );
};

DataGridHeader.displayName = 'DataGridHeader';
