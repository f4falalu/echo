'use client';

import React, { useState } from 'react';
import { useBusterDashboardIndividual } from '@/context/Dashboards';
import { FileIndeterminateLoader } from '@appComponents/FileIndeterminateLoader';
import { DashboardFileView, useChatLayoutContextSelector } from '@appLayouts/ChatLayout';
import { DashboardViewComponents } from './config';
import { AddTypeModal } from '../../_components/Modals/AddTypeModal';
import { useMemoizedFn } from 'ahooks';

export const DashboardController: React.FC<{ dashboardId: string }> = ({ dashboardId }) => {
  const { dashboardResponse } = useBusterDashboardIndividual({
    dashboardId
  });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'dashboard';
  const [openAddTypeModal, setOpenAddTypeModal] = useState(false);
  const onCloseModal = useMemoizedFn(() => {
    setOpenAddTypeModal(false);
  });

  const showLoader = !dashboardResponse?.dashboard?.id;

  const Component =
    selectedFileView && dashboardResponse
      ? DashboardViewComponents[selectedFileView as DashboardFileView]
      : () => null;

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
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
