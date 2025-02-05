import { AppMaterialIcons } from '@/components/icons';
import { Button } from 'antd';
import React from 'react';

export const DashboardEmptyState: React.FC<{
  openAddContentModal: () => void;
}> = React.memo(({ openAddContentModal }) => {
  return (
    <div className="-ml-1.5">
      <Button type="text" icon={<AppMaterialIcons icon="add" />} onClick={openAddContentModal}>
        Add content
      </Button>
    </div>
  );
});
DashboardEmptyState.displayName = 'DashboardEmptyState';
