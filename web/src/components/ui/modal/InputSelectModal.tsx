import React, { useMemo } from 'react';
import { BorderedModal, BorderedModalProps } from './BorderedModal';
import { Input } from '../inputs/Input';
import { BusterList, BusterListProps } from '../list/BusterList';
import { useDebounceSearch } from '@/hooks';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogTitle } from '@radix-ui/react-dialog';
import { Text } from '../typography';

export interface InputSelectModalProps extends Omit<BorderedModalProps, 'children'> {
  inputPlaceholder?: string;
  columns: NonNullable<BusterListProps['columns']>;
  rows: NonNullable<BusterListProps['rows']>;
  emptyState: BusterListProps['emptyState'];
  onSelectChange: NonNullable<BusterListProps['onSelectChange']>;
  selectedRowKeys: NonNullable<BusterListProps['selectedRowKeys']>;
  showHeader?: NonNullable<BusterListProps['showHeader']>;
}

export const InputSelectModal = React.memo(
  ({
    inputPlaceholder = 'Search...',
    columns,
    rows,
    emptyState,
    onSelectChange,
    selectedRowKeys,
    showHeader = true,
    ...props
  }: InputSelectModalProps) => {
    const { filteredItems, handleSearchChange, searchText } = useDebounceSearch({
      items: rows,
      searchPredicate: (item, searchText) => {
        const values = Object.values(item.data || {});
        return values.some((value) =>
          value.toString().toLowerCase().includes(searchText.toLowerCase())
        );
      }
    });

    return (
      <BorderedModal
        header={
          <>
            <InputSelecteHeader
              searchText={searchText}
              handleSearchChange={handleSearchChange}
              inputPlaceholder={inputPlaceholder}
            />
            <VisuallyHidden>
              <DialogTitle>Input Modal</DialogTitle>
            </VisuallyHidden>
          </>
        }
        {...props}>
        <div
          className="max-h-90"
          style={{
            height: (filteredItems.length || 1) * 48 + (showHeader ? 32 : 0) //32 is the height of the header
          }}>
          <BusterList
            columns={columns}
            rows={filteredItems}
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
