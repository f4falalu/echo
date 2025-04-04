import React, { CSSProperties } from 'react';
import { DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { Header, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/classMerge';
import { CaretDown, CaretUp } from '../../../icons/NucleoIconFilled';
import { HEADER_HEIGHT } from './constants';
import { useSortColumnContext } from './SortColumnWrapper';

interface DraggableHeaderProps {
  header: Header<Record<string, string | number | Date | null>, unknown>;
  resizable: boolean;
  sortable: boolean;
  overTargetId: string | null;
}

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
      <th
        ref={setDropNodeRef}
        style={style}
        className={cn(
          'group bg-background relative border-r select-none last:border-r-0',
          header.column.getIsResizing() ? 'bg-primary/8' : 'hover:bg-item-hover',
          isOverTarget &&
            'bg-primary/10 border-primary inset rounded-sm border border-r border-dashed'
        )}
        // onClick toggles sorting if enabled
        onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}>
        <span
          className="flex h-full flex-1 items-center space-x-1.5 p-2"
          ref={sortable ? setDragNodeRef : undefined}
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab' }}>
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
            <span
              onMouseDown={header.getResizeHandler()}
              onTouchStart={header.getResizeHandler()}
              className={cn(
                'hover:bg-primary group-hover:bg-border absolute top-0 -right-[3px] z-10 h-full w-1 cursor-col-resize transition-colors duration-100 select-none hover:w-1',
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

// Header content component to use in the DragOverlay
const HeaderDragOverlay = ({
  header
}: {
  header: Header<Record<string, string | number | Date | null>, unknown>;
}) => {
  return (
    <div
      className="flex items-center rounded-sm border bg-white p-2 shadow-lg"
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

interface DataGridHeaderProps {
  table: Table<Record<string, string | number | Date | null>>;
  sortable: boolean;
  resizable: boolean;
}

export const DataGridHeader: React.FC<DataGridHeaderProps> = ({ table, sortable, resizable }) => {
  const { activeId, overTargetId, activeHeader } = useSortColumnContext((x) => x);

  return (
    <thead className="bg-background sticky top-0 z-10 w-full" suppressHydrationWarning>
      <tr className="flex border-b shadow">
        {table
          .getHeaderGroups()[0]
          ?.headers.map(
            (header: Header<Record<string, string | number | Date | null>, unknown>) => (
              <DraggableHeader
                key={header.id}
                header={header}
                sortable={sortable}
                resizable={resizable}
                overTargetId={overTargetId}
              />
            )
          )}
      </tr>

      {/* Drag Overlay */}
      <DragOverlay
        wrapperElement="span"
        adjustScale={false}
        dropAnimation={null} // Using null to completely disable animation
        zIndex={1000}>
        {activeId && activeHeader && <HeaderDragOverlay header={activeHeader} />}
      </DragOverlay>
    </thead>
  );
};

DataGridHeader.displayName = 'DataGridHeader';
