'use client';

import { useUserConfigContextSelector } from '@/context/Users';
import { DashboardViewProps } from '../config';
import React, { useState } from 'react';
import {
  useBusterDashboardContextSelector,
  useBusterDashboardIndividual
} from '@/context/Dashboards';
import { ShareRole } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardContentController } from './DashboardContentController';

export const DashboardViewDashboardController: React.FC<DashboardViewProps> = ({ dashboardId }) => {
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const { dashboardResponse, metrics, dashboard } = useBusterDashboardIndividual({
    dashboardId
  });
  const onUpdateDashboard = useBusterDashboardContextSelector((x) => x.onUpdateDashboard);
  const onUpdateDashboardConfig = useBusterDashboardContextSelector(
    (x) => x.onUpdateDashboardConfig
  );
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
