import { Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';

import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons';
import React from 'react';
import { useDeleteCollection } from '@/api/buster_rest/collections';

export const CollectionListSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const show = selectedRowKeys.length > 0;

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <CollectionDeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
      show={show}
    />
  );
};

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const { mutateAsync: deleteCollection, isPending: isDeletingCollection } = useDeleteCollection();

  const onDeleteClick = useMemoizedFn(async () => {
    try {
      await deleteCollection({ id: selectedRowKeys });
      onSelectChange([]);
    } catch (error) {
      //  openErrorMessage('Failed to delete collection');
    }
  });

  return (
    <Button disabled={isDeletingCollection} prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};
