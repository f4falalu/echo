import { BusterListSelectedOptionPopupContainer } from '@/components/list';
import { Button } from 'antd';
import React from 'react';

export const PermissionGroupSelectedPopup: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = React.memo(({ selectedRowKeys, onSelectChange }) => {
  return (
    <BusterListSelectedOptionPopupContainer
      selectedRowKeys={selectedRowKeys}
      onSelectChange={onSelectChange}
      buttons={[
        <PermissionGroupAssignButton
          key="assign"
          selectedRowKeys={selectedRowKeys}
          onSelectChange={onSelectChange}
        />
      ]}
    />
  );
});

PermissionGroupSelectedPopup.displayName = 'PermissionGroupSelectedPopup';

const PermissionGroupAssignButton: React.FC<{
  selectedRowKeys: string[];
  onSelectChange: (selectedRowKeys: string[]) => void;
}> = ({ selectedRowKeys, onSelectChange }) => {
  return <Button>Assign</Button>;
};
