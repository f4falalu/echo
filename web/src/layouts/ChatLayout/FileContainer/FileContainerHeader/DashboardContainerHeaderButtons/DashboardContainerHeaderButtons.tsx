'use client';

import React from 'react';
import { FileContainerButtonsProps } from '../interfaces';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useIsDashboardReadOnly } from '@/context/Dashboards/useIsDashboardReadOnly';
import { DashboardHeaderButtons } from './DashboardHeaderButtons';
import { VersionHistoryHeaderButtons } from '../FileContainerHeaderVersionHistory/VersionHistoryHeaderButtons';

export const DashboardContainerHeaderButtons: React.FC<FileContainerButtonsProps> = React.memo(
  ({ selectedFileId }) => {
    const dashboardId = selectedFileId || '';
    const { isViewingOldVersion } = useIsDashboardReadOnly({
      dashboardId
    });

    const { data: permission, error: dashboardError } = useGetDashboard(
      { id: dashboardId },
      { select: (x) => x.permission }
    );

    if (dashboardError || !permission) return null;

    if (isViewingOldVersion) return <VersionHistoryHeaderButtons />;

    return <DashboardHeaderButtons dashboardId={dashboardId} />;
  }
);

DashboardContainerHeaderButtons.displayName = 'DashboardContainerHeaderButtons';
