'use client';

import { VList } from 'virtua';
import React, { useMemo } from 'react';
import { BusterListProps } from './interfaces';
import { useMemoizedFn } from 'ahooks';
import { getAllIdsInSection } from './helpers';
import { HEIGHT_OF_ROW, HEIGHT_OF_SECTION_ROW } from './config';
import { BusterListHeader } from './BusterListHeader';
import { BusterListRowComponentSelector } from './BusterListRowComponentSelector';
import { ContextMenu, ContextMenuProps } from '../../context/ContextMenu';

export const BusterListVirtua = React.memo(
  ({
    columns,
    rows,
    selectedRowKeys,
    onSelectChange,
    emptyState,
    showHeader = true,
    contextMenu,
    showSelectAll = true,
    useRowClickSelectChange = false,
    rowClassName = '',
    hideLastRowBorder = false
  }: BusterListProps) => {
    const showEmptyState = (!rows || rows.length === 0) && !!emptyState;
    const lastChildIndex = rows.length - 1;

    const globalCheckStatus = useMemo(() => {
      if (!selectedRowKeys) return 'unchecked';
      if (selectedRowKeys.length === 0) return 'unchecked';
      if (selectedRowKeys.length === rows.length) return 'checked';
      return 'indeterminate';
    }, [selectedRowKeys?.length, rows.length]);

    const onGlobalSelectChange = useMemoizedFn((v: boolean) => {
      onSelectChange?.(v ? rows.map((row) => row.id) : []);
    });

    const onSelectSectionChange = useMemoizedFn((v: boolean, id: string) => {
      if (!onSelectChange) return;
      const idsInSection = getAllIdsInSection(rows, id);

      if (v === false) {
        onSelectChange(selectedRowKeys?.filter((d) => !idsInSection.includes(d)) || []);
      } else {
        onSelectChange(selectedRowKeys?.concat(idsInSection) || []);
      }
    });

    const onSelectChangePreflight = useMemoizedFn((v: boolean, id: string) => {
      if (!onSelectChange || !selectedRowKeys) return;
      if (v === false) {
        onSelectChange(selectedRowKeys?.filter((d) => d !== id));
      } else {
        onSelectChange(selectedRowKeys?.concat(id) || []);
      }
    });

    const itemSize = useMemoizedFn((index: number) => {
      const row = rows[index];
      return row.rowSection ? HEIGHT_OF_SECTION_ROW : HEIGHT_OF_ROW;
    });

    const itemData = useMemo(() => {
      return {
        columns,
        rows,
        selectedRowKeys,
        onSelectChange: onSelectChange ? onSelectChangePreflight : undefined,
        onSelectSectionChange: onSelectChange ? onSelectSectionChange : undefined,
        useRowClickSelectChange,
        hideLastRowBorder
      };
    }, [
      columns,
      rows,
      useRowClickSelectChange,
      selectedRowKeys,
      onSelectChange,
      onSelectSectionChange,
      hideLastRowBorder
    ]);

    const WrapperNode = !!contextMenu ? ContextMenu : React.Fragment;
    const wrapperNodeProps: ContextMenuProps = !!contextMenu
      ? contextMenu
      : ({} as ContextMenuProps);

    return (
      <WrapperNode {...wrapperNodeProps}>
        <div className="list-container relative flex h-full w-full flex-col overflow-hidden">
          {showHeader && !showEmptyState && (
            <BusterListHeader
              columns={columns}
              onGlobalSelectChange={onSelectChange ? onGlobalSelectChange : undefined}
              globalCheckStatus={globalCheckStatus}
              rowsLength={rows.length}
              showSelectAll={showSelectAll}
              rowClassName={rowClassName}
            />
          )}

          {!showEmptyState && (
            <VList>
              {rows.map((row, index) => (
                <div key={index} style={{ height: itemSize(index) }}>
                  <BusterListRowComponentSelector
                    row={row}
                    id={row.id}
                    isLastChild={index === lastChildIndex}
                    {...itemData}
                  />
                </div>
              ))}
            </VList>
          )}

          {showEmptyState && (
            <div className="flex h-full items-center justify-center">{emptyState}</div>
          )}
        </div>
      </WrapperNode>
    );
  }
);

BusterListVirtua.displayName = 'BusterListVirtua';
