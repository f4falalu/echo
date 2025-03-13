'use client';

import { useUserConfigContextSelector } from '@/context/Users';
import { DashboardViewProps } from '../config';
import React, { useState } from 'react';
import { useBusterDashboardIndividual } from '@/context/Dashboards';
import { ShareRole } from '@/api/asset_interfaces/share';
import { useMemoizedFn } from '@/hooks';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardContentController } from './DashboardContentController';
import { useUpdateDashboard, useUpdateDashboardConfig } from '@/api/buster_rest/dashboards';

export const DashboardViewDashboardController: React.FC<DashboardViewProps> = ({ dashboardId }) => {
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const { dashboardResponse, metrics, dashboard } = useBusterDashboardIndividual({
    dashboardId
  });
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard();
  const { mutateAsync: onUpdateDashboardConfig } = useUpdateDashboardConfig();

  const [openAddContentModal, setOpenAddContentModal] = useState(false);

  const allowEdit = dashboardResponse?.permission !== ShareRole.VIEWER && !isAnonymousUser;

  const onOpenAddContentModal = useMemoizedFn(() => {
    setOpenAddContentModal(true);
  });

  return (
    <div className="flex flex-col space-y-3 overflow-y-auto p-10">
      <DashboardEditTitles
        onUpdateDashboard={onUpdateDashboard}
        dashboardId={dashboardId}
        allowEdit={allowEdit}
        title={dashboardResponse?.dashboard?.name || ''}
        description={dashboardResponse?.dashboard?.description || ''}
      />

      <DashboardContentController
        metrics={metrics}
        dashboard={dashboard}
        onUpdateDashboardConfig={onUpdateDashboardConfig}
        onOpenAddContentModal={onOpenAddContentModal}
      />
    </div>
  );
};
