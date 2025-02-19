import { AppMaterialIcons } from '@/components/icons';
import { Button } from 'antd';
import React from 'react';

export const DashboardEmptyState: React.FC<{
  onOpenAddContentModal: () => void;
}> = React.memo(({ onOpenAddContentModal }) => {
  return (
    <div className="-ml-1.5">
      <Button type="text" icon={<AppMaterialIcons icon="add" />} onClick={onOpenAddContentModal}>
        Add content
      </Button>
    </div>
  );
});
DashboardEmptyState.displayName = 'DashboardEmptyState';
