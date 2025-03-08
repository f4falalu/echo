import { Plus, Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import { Button } from '@/components/ui/buttons';
import React from 'react';

export const CollectionIndividualSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onDeleteClick: () => Promise<void>;
}> = ({ selectedRowKeys, onSelectChange, onDeleteClick }) => {
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
          onDeleteClick={onDeleteClick}
        />
      ]}
      show={show}
    />
  );
};

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onDeleteClick: () => Promise<void>;
}> = ({ selectedRowKeys, onSelectChange, onDeleteClick }) => {
  const onBulkAddRemoveToCollection = useBusterCollectionIndividualContextSelector(
    (x) => x.onBulkAddRemoveToCollection
  );

  return (
    <Button prefix={<Trash />} onClick={onDeleteClick}>
      Delete
    </Button>
  );
};
