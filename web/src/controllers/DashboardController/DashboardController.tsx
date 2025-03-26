'use client';

import React from 'react';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { DashboardFileView, useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { DashboardViewComponents } from './config';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useDashboardContentStore } from '@/context/Dashboards';
import { AddToDashboardModal } from '@/components/features/modal/AddToDashboardModal';
import { canEdit } from '@/lib/share';

export const DashboardController: React.FC<{ dashboardId: string }> = ({ dashboardId }) => {
  const { isFetched: isFetchedDashboard, data: permission } = useGetDashboard(
    { id: dashboardId },
    (x) => x.permission
  );
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'dashboard';
  const isEditor = canEdit(permission);

  const Component =
    selectedFileView && isFetchedDashboard && selectedFileView in DashboardViewComponents
      ? DashboardViewComponents[selectedFileView as DashboardFileView]
      : () => null;

  return (
    <>
      {!isFetchedDashboard && <FileIndeterminateLoader />}
      <Component dashboardId={dashboardId} readOnly={!isEditor} />

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
