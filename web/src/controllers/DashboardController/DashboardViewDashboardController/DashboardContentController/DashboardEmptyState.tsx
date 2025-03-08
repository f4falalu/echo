import { Button } from '@/components/ui/buttons';
import { Plus } from '@/components/ui/icons';
import React from 'react';

export const DashboardEmptyState: React.FC<{
  onOpenAddContentModal: () => void;
}> = React.memo(({ onOpenAddContentModal }) => {
  return (
    <div className="-ml-1.5">
      <Button variant="ghost" prefix={<Plus />} onClick={onOpenAddContentModal}>
        Add content
      </Button>
    </div>
  );
});
DashboardEmptyState.displayName = 'DashboardEmptyState';
