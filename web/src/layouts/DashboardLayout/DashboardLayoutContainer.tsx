'use client';

import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { AddToDashboardModal } from '@/components/features/modal/AddToDashboardModal';
import { useDashboardContentStore } from '@/context/Dashboards';
import { canEdit } from '@/lib/share';
import React from 'react';

export const DashboardLayoutContainer: React.FC<{
  children: React.ReactNode;
  dashboardId: string;
}> = ({ children, dashboardId }) => {
  const { data: permission } = useGetDashboard({ id: dashboardId }, (x) => x.permission);
  const isEditor = canEdit(permission);

  return (
    <>
      {children}
      {isEditor && <MemoizedAddToDashboardModal dashboardId={dashboardId} />}
    </>
  );
};

const MemoizedAddToDashboardModal = React.memo(({ dashboardId }: { dashboardId: string }) => {
  const { openAddContentModal, onCloseAddContentModal } = useDashboardContentStore();

  return (
    <AddToDashboardModal
      open={openAddContentModal}
      onClose={onCloseAddContentModal}
      dashboardId={dashboardId}
    />
  );
});

MemoizedAddToDashboardModal.displayName = 'MemoizedAddToDashboardModal';
