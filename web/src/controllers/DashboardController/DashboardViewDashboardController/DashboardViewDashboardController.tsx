'use client';

import { useUserConfigContextSelector } from '@/context/Users';
import { DashboardViewProps } from '../config';
import React, { useState } from 'react';
import { ShareRole } from '@/api/asset_interfaces/share';
import { useMemoizedFn } from '@/hooks';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardContentController } from './DashboardContentController';
import {
  useGetDashboard,
  useUpdateDashboard,
  useUpdateDashboardConfig
} from '@/api/buster_rest/dashboards';

export const DashboardViewDashboardController: React.FC<DashboardViewProps> = ({
  dashboardId,
  readOnly = false
}) => {
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const { data: dashboardResponse } = useGetDashboard(dashboardId);
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard();
  const { mutateAsync: onUpdateDashboardConfig } = useUpdateDashboardConfig();
  const [openAddContentModal, setOpenAddContentModal] = useState(false);

  const allowEdit =
    !readOnly && dashboardResponse?.permission !== ShareRole.VIEWER && !isAnonymousUser;
  const metrics = dashboardResponse?.metrics;
  const dashboard = dashboardResponse?.dashboard;

  const onOpenAddContentModal = useMemoizedFn(() => {
    setOpenAddContentModal(true);
  });

  return (
    <div className="flex flex-col space-y-3 overflow-y-auto p-10">
      <DashboardEditTitles
        onUpdateDashboard={onUpdateDashboard}
        dashboardId={dashboardId}
        readOnly={readOnly}
        title={dashboardResponse?.dashboard?.name || ''}
        description={dashboardResponse?.dashboard?.description || ''}
      />

      <DashboardContentController
        metrics={metrics}
        dashboard={dashboard}
        onUpdateDashboardConfig={onUpdateDashboardConfig}
        onOpenAddContentModal={onOpenAddContentModal}
        readOnly={readOnly}
      />
    </div>
  );
};
