'use client';

import React from 'react';
import { BusterListSelectedOptionPopupContainer } from '@/components/ui/list';
import { Button } from '@/components/ui/buttons';
import { useMemoizedFn } from '@/hooks';
import { useBusterTermsIndividualContextSelector } from '@/context/Terms';

export const TermListSelectedOptionPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <DeleteButton
          key="delete"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
      show={selectedRowKeys.length > 0}
    />
  );
};

const DeleteButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  const onDeleteTerm = useBusterTermsIndividualContextSelector((x) => x.onDeleteTerm);

  const onDeleteClick = useMemoizedFn(async () => {
    await onDeleteTerm({ ids: selectedRowKeys });
    onSelectChange([]);
  });

  return <Button onClick={onDeleteClick}>Delete</Button>;
};
