import { Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import { useMemoizedFn } from '@/hooks';
import { Button } from '@/components/ui/buttons';
import React from 'react';

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
  const deleteCollection = useBusterCollectionIndividualContextSelector((x) => x.deleteCollection);

  const onDeleteClick = useMemoizedFn(async () => {
    try {
      const deletePromises = selectedRowKeys.map((v) => deleteCollection(v, false));
      await Promise.all(deletePromises);
      onSelectChange([]);
    } catch (error) {
      //  openErrorMessage('Failed to delete collection');
    }
  });

  return (
    <Button prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};
