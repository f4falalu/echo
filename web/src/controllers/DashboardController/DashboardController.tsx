'use client';

import React, { useState } from 'react';
import { FileIndeterminateLoader } from '@/components/features/FileIndeterminateLoader';
import { DashboardFileView, useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { DashboardViewComponents } from './config';
import { AddTypeModal } from '@/components/features/modal/AddTypeModal';
import { useMemoizedFn } from '@/hooks';
import { useGetDashboard } from '@/api/buster_rest/dashboards';

export const DashboardController: React.FC<{ dashboardId: string; readOnly?: boolean }> = ({
  dashboardId,
  readOnly = false
}) => {
  const { data: dashboardResponse, isFetched: isFetchedDashboard } = useGetDashboard(dashboardId);
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'dashboard';
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);
  const onCloseModal = useMemoizedFn(() => {
    setOpenAddTypeModal(false);
  });

  const Component =
    selectedFileView && isFetchedDashboard
      ? DashboardViewComponents[selectedFileView as DashboardFileView]
      : () => null;

  return (
    <>
      {!isFetchedDashboard && <FileIndeterminateLoader />}
      <Component dashboardId={dashboardId} />

      <AddTypeModal
        open={openAddTypeModal}
        onClose={onCloseModal}
        type="dashboard"
        dashboardResponse={dashboardResponse}
      />
    </>
  );
};
