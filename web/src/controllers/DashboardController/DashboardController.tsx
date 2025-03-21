'use client';

import React from 'react';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { DashboardFileView, useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { DashboardViewComponents } from './config';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useDashboardContentStore } from '@/context/Dashboards';
import { AddToDashboardModal } from '@/components/features/modal/AddToDashboardModal';
import { canEdit } from '@/lib/share';
import { useWhyDidYouUpdate } from '@/hooks';

export const DashboardController: React.FC<{ dashboardId: string }> = ({ dashboardId }) => {
  const { isFetched: isFetchedDashboard, data: permission } = useGetDashboard(
    dashboardId,
    (x) => x.permission
  );
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'dashboard';
  const { openAddContentModal, onCloseAddContentModal } = useDashboardContentStore();
  const isEditor = canEdit(permission);

  const Component =
    selectedFileView && isFetchedDashboard && selectedFileView in DashboardViewComponents
      ? DashboardViewComponents[selectedFileView as DashboardFileView]
      : () => null;

  return (
    <>
      {!isFetchedDashboard && <FileIndeterminateLoader />}
      <Component dashboardId={dashboardId} readOnly={!isEditor} />

      {isEditor && (
        <AddToDashboardModal
          open={openAddContentModal}
          onClose={onCloseAddContentModal}
          dashboardId={dashboardId}
        />
      )}
    </>
  );
};
