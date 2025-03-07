'use client';

import { SortableContext, useSortable } from '@dnd-kit/sortable';
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { BusterSortableItemDragContainer } from './_BusterSortableItemDragContainer';
import { ResizeableGridDragItem } from './interfaces';
import { useMemoizedFn, useMouse } from '@/hooks';
import { BusterDragColumnMarkers } from './_BusterDragColumnMarkers';
import { calculateColumnSpan, columnSpansToPercent } from './config';
import SplitPane, { Pane } from '../layouts/AppSplitter/SplitPane';
import { cn } from '@/lib/classMerge';

type ContainerProps = {
  rowId: string;
  items: ResizeableGridDragItem[];
  index: number;
  columnSizes: number[] | undefined;
  allowEdit?: boolean;
  onRowLayoutChange: (layout: number[], rowId: string) => void;
  fluid?: boolean;
};

export const BusterResizeColumns: React.FC<ContainerProps> = ({
  rowId,
  onRowLayoutChange = () => {},
  index: rowIndex,
  columnSizes,
  allowEdit = true,
  items = [],
  fluid = true
}) => {
  const { setNodeRef, isOver, active, over } = useSortable({
    id: rowId,
    disabled: !allowEdit
  });
  const mouse = useMouse({ moveThrottleMs: 50, disabled: !allowEdit || !over });
  const [isDragginResizeColumn, setIsDraggingResizeColumn] = useState<number | null>(null);
  const columnMarkerColumnIndex = useMemo(
    () => (typeof isDragginResizeColumn === 'number' ? isDragginResizeColumn + 1 : null),
    [isDragginResizeColumn]
  );
  const canResize = useMemo(() => items.length > 1 && items.length < 4, [items.length]);
  const isDropzoneActives = useMemo(() => !!over?.id && canResize, [over?.id, canResize]);

  const insertPosition = useMemoizedFn((itemId: string, _index: number, mouseLeft: number) => {
    const movedIndex = _index;

    // If the item is the only one in the container, don't show any dropzones
    if (active?.data.current?.sortable?.containerId === rowId && items.length === 1) {
      return undefined;
    }

    if (active?.data.current?.sortable?.containerId === over?.data.current?.sortable?.containerId) {
      const res =
        over?.id === itemId
          ? movedIndex > activeIndex
            ? Position.After
            : Position.Before
          : undefined;

      return res;
    }

    const isLastItem =
      over?.id === itemId && over?.data.current?.sortable?.index === items.length - 1;

    if (isLastItem) {
      const widthOfItem = over?.rect.width;
      const leftSideOfItem = over?.rect.left;
      const isOverLeftHalf = mouseLeft < leftSideOfItem + widthOfItem / 2;

      if (isOverLeftHalf) {
        return Position.Before;
      }

      return Position.After;
    }

    const res =
      over?.id === itemId
        ? movedIndex > over?.data.current?.sortable?.index
          ? Position.After
          : Position.Before
        : undefined;

    return res;
  });

  //NEW LOGIC
  const [_sizes, setSizes] = useState<(number | string)[]>(columnSpansToPercent(columnSizes));
  const sizes = _sizes.length === items.length ? _sizes : columnSpansToPercent(columnSizes);
  const [stagedLayoutColumns, setStagedLayoutColumns] = useState<number[]>([]);

  const activeDragId = active?.id;
  const activeIndex = useMemo(() => {
    return activeDragId ? items.findIndex((item) => item.id === active?.id) : -1;
  }, [activeDragId, items, active?.id]);

  const memoizedStyle = useMemo(() => {
    return {
      backgroundColor: isOver ? 'rgba(0, 0, 0, 0.25)' : undefined
    };
  }, [isOver]);

  const onChangeLayout = useMemoizedFn((sizes: number[]) => {
    setSizes(sizes);
    setStagedLayoutColumns(calculateColumnSpan(sizes));
  });

  const onDragEnd = useMemoizedFn(() => {
    setIsDraggingResizeColumn(null);
    const sizesFromColumnSpans = columnSpansToPercent(stagedLayoutColumns);
    setSizes(sizesFromColumnSpans);
    onRowLayoutChange(stagedLayoutColumns, rowId);
  });

  const onDragStart = useMemoizedFn((e: MouseEvent) => {
    const srcElement = e.target as HTMLElement;
    const idOrSrcElement = srcElement?.id;
    if (idOrSrcElement) {
      const parsedId = parseInt(idOrSrcElement);
      if (typeof parsedId === 'number') {
        setIsDraggingResizeColumn(parsedId);
      }
    }
  });

  const sashRender = useMemoizedFn((index: number, active: boolean) => {
    return (
      <ColumnSash
        allowEdit={allowEdit && canResize}
        isDraggingId={isDragginResizeColumn}
        active={active}
        index={index}
      />
    );
  });

  useLayoutEffect(() => {
    setSizes(columnSpansToPercent(columnSizes));
  }, [items.length, columnSizes?.length]);

  return (
    <SortableContext id={rowId} items={items} disabled={false}>
      <div ref={setNodeRef} className="relative h-full w-full" style={memoizedStyle}>
        <BusterDragColumnMarkers
          isDraggingIndex={columnMarkerColumnIndex}
          itemsLength={items.length}
          stagedLayoutColumns={stagedLayoutColumns}
          disabled={!canResize}
        />

        <SplitPane
          autoSizeId="resize-column"
          split="vertical"
          sizes={sizes}
          allowResize={allowEdit && canResize}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          sashRender={sashRender}
          onChange={onChangeLayout}>
          {items.map((item, index) => (
            <Pane
              className={cn(
                'overflow-visible!',
                index !== items.length - 1 ? 'pr-1.5' : 'pr-0',
                index !== 0 ? 'pl-1.5' : 'pl-0'
              )}
              key={item.id}
              minSize={'25%'}>
              <div className="relative h-full w-full">
                <DropzonePlaceholder
                  right={false}
                  isDropzoneActives={isDropzoneActives}
                  active={
                    !!over && insertPosition(item.id, index, mouse.clientX) === Position.Before
                  }
                />
                <BusterSortableItemDragContainer itemId={item.id} allowEdit={allowEdit}>
                  {item.children}
                </BusterSortableItemDragContainer>
                <DropzonePlaceholder
                  right={true}
                  isDropzoneActives={isDropzoneActives}
                  active={
                    !!over && insertPosition(item.id, index, mouse.clientX) === Position.After
                  }
                />
              </div>
            </Pane>
          ))}
        </SplitPane>
      </div>
    </SortableContext>
  );
};

export enum Position {
  Before = -1,
  After = 1
}

const DropzonePlaceholder: React.FC<{
  active: boolean;
  right: boolean;
  isDropzoneActives: boolean;
}> = React.memo(({ active, right, isDropzoneActives }) => {
  const memoizedStyle = useMemo(() => {
    return {
      right: right ? -7.5 : undefined,
      left: right ? undefined : -7.5,
      opacity: active || isDropzoneActives ? 1 : 0
    };
  }, [active, isDropzoneActives, right]);

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-0 bottom-0 h-full w-[4px] rounded-lg transition-opacity duration-200',
        'bg-nav-item-hover z-[1]',
        isDropzoneActives && 'placeholder',
        active && 'bg-primary! opacity-100'
      )}
      style={memoizedStyle}
    />
  );
});
DropzonePlaceholder.displayName = 'DropzonePlaceholder';

const ColumnSash: React.FC<{
  index: number;
  active: boolean;
  isDraggingId: number | null;
  allowEdit: boolean;
}> = React.memo(({ active, allowEdit, isDraggingId, index }) => {
  return (
    <div
      className={cn(
        'grid-column-sash h-full w-[4px] rounded-lg',
        'z-10 transition-colors duration-200 ease-in-out',
        allowEdit ? 'hover:bg-border' : 'hidden',
        active ? 'bg-border' : '',
        isDraggingId === index ? 'bg-primary!' : ''
      )}
      id={index.toString()}
    />
  );
});
ColumnSash.displayName = 'ColumnSash';
