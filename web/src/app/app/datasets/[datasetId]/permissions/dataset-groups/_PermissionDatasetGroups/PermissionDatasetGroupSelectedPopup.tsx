import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import React from 'react';
import { PermissionAssignedButton } from '@appComponents/PermissionComponents';

export const PermissionDatasetGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
  datasetId: string;
}> = React.memo(({ selectedRowKeys, onSelectChange, datasetId }) => {
  const show = selectedRowKeys.length > 0;

  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <PermissionAssignedButton
          key="assign"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
          datasetId={datasetId}
        />
      ]}
      show={show}
    />
  );
});
PermissionDatasetGroupSelectedPopup.displayName = 'PermissionDatasetGroupSelectedPopup';
