import { Trash } from '@/components/ui/icons';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { Button } from '@/components/ui/buttons';
import React from 'react';

export const CollectionIndividualSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onRemoveFromCollection: () => Promise<void>;
}> = ({ selectedRowKeys, onSelectChange, onRemoveFromCollection }) => {
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
          onRemoveFromCollection={onRemoveFromCollection}
        />
      ]}
      show={show}
    />
  );
};

const CollectionDeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  onRemoveFromCollection: () => Promise<void>;
}> = ({ onRemoveFromCollection }) => {
  return (
    <Button prefix={<Trash />} onClick={onRemoveFromCollection}>
      Delete
    </Button>
  );
};
