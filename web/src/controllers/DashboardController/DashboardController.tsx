'use client';

import React from 'react';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { DashboardFileView, useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { DashboardViewComponents } from './config';
import { AddTypeModal } from '@/components/features/modal/AddTypeModal';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useDashboardContentStore } from '@/context/Dashboards';

export const DashboardController: React.FC<{ dashboardId: string }> = ({ dashboardId }) => {
  const { data: dashboardResponse, isFetched: isFetchedDashboard } = useGetDashboard(dashboardId);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'dashboard';
  const { openAddContentModal, onCloseAddContentModal } = useDashboardContentStore();

  const Component =
    selectedFileView && isFetchedDashboard
      ? DashboardViewComponents[selectedFileView as DashboardFileView]
      : () => null;

  return (
    <>
      {!isFetchedDashboard && <FileIndeterminateLoader />}
      <Component dashboardId={dashboardId} />

      <AddTypeModal
        open={openAddContentModal}
        onClose={onCloseAddContentModal}
        type="dashboard"
        dashboardResponse={dashboardResponse}
      />
    </>
  );
};
