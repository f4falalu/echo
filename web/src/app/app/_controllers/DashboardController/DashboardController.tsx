'use client';

import React from 'react';
import { useBusterDashboardIndividual } from '@/context/Dashboards';
import { FileIndeterminateLoader } from '@appComponents/FileIndeterminateLoader';
import { DashboardFileView, useChatLayoutContextSelector } from '@appLayouts/ChatLayout';
import { DashboardViewComponents } from './config';

export const DashboardController: React.FC<{ dashboardId: string }> = ({ dashboardId }) => {
  const { dashboardResponse } = useBusterDashboardIndividual({
    dashboardId
  });
  const selectedFileView = useChatLayoutContextSelector((x) => x.selectedFileView) || 'dashboard';

  const showLoader = !dashboardResponse?.dashboard?.id;

  const Component =
    selectedFileView && dashboardResponse
      ? DashboardViewComponents[selectedFileView as DashboardFileView]
      : () => null;

  return (
    <>
      {showLoader && <FileIndeterminateLoader />}
      <Component dashboardId={dashboardId} />
    </>
  );
};
