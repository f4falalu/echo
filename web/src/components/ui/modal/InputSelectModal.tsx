import React, { useMemo } from 'react';
import { BorderedModal, BorderedModalProps } from './BorderedModal';
import { Input } from '../inputs/Input';
import { BusterList, BusterListProps } from '../list/BusterList';
import { useDebounceSearch } from '@/hooks';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogDescription, DialogTitle } from '@radix-ui/react-dialog';
import { Text } from '../typography';

export interface InputSelectModalProps extends Omit<BorderedModalProps, 'children'> {
  inputPlaceholder?: string;
  columns: NonNullable<BusterListProps['columns']>;
  rows: NonNullable<BusterListProps['rows']>;
  emptyState: BusterListProps['emptyState'];
  onSelectChange: NonNullable<BusterListProps['onSelectChange']>;
  selectedRowKeys: NonNullable<BusterListProps['selectedRowKeys']>;
  showHeader?: NonNullable<BusterListProps['showHeader']>;
  searchText: string;
  handleSearchChange: (searchText: string) => void;
}

export const InputSelectModal = React.memo(
  ({
    inputPlaceholder = 'Search...',
    columns,
    rows,
    emptyState,
    onSelectChange,
    selectedRowKeys,
    searchText,
    handleSearchChange,
    showHeader = true,
    ...props
  }: InputSelectModalProps) => {
    const memoizedHeader = useMemo(() => {
      return (
        <>
          <InputSelecteHeader
            searchText={searchText}
            handleSearchChange={handleSearchChange}
            inputPlaceholder={inputPlaceholder}
          />
          <VisuallyHidden>
            <DialogTitle>Input Modal</DialogTitle>
            <DialogDescription>
              {rows.length} {rows.length === 1 ? 'item' : 'items'} found
            </DialogDescription>
          </VisuallyHidden>
        </>
      );
    }, [searchText, handleSearchChange, inputPlaceholder, rows.length]);

    return (
      <BorderedModal header={memoizedHeader} {...props}>
        <div
          className="max-h-[65vh]"
          style={{
            height: (rows.length || 1) * 48 + (showHeader ? 32 : 0) //32 is the height of the header
          }}>
          <BusterList
            columns={columns}
            rows={rows}
            onSelectChange={onSelectChange}
            emptyState={useMemo(
              () => emptyState || <Text variant={'secondary'}>No items found</Text>,
              [emptyState]
            )}
            showHeader={showHeader}
            selectedRowKeys={selectedRowKeys}
            useRowClickSelectChange={true}
            hideLastRowBorder
          />
        </div>
      </BorderedModal>
    );
  }
);
InputSelectModal.displayName = 'InputScrollableModal';

const InputSelecteHeader: React.FC<{
  inputPlaceholder: string;
  searchText: string;
  handleSearchChange: (searchText: string) => void;
}> = ({ inputPlaceholder, searchText, handleSearchChange }) => {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Input
        value={searchText}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder={inputPlaceholder}
        variant={'ghost'}
        type="text"
        size={'tall'}
        autoFocus
      />
    </div>
  );
};
