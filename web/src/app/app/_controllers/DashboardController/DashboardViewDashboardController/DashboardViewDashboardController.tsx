import { useUserConfigContextSelector } from '@/context/Users';
import { DashboardViewProps } from '../config';
import React from 'react';
import { useBusterDashboardIndividual, useDashboardContextSelector } from '@/context/Dashboards';
import { ShareRole } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import { DashboardEditTitles } from './DashboardEditTitle';
import { DashboardContentController } from './DashboardContentController';

export const DashboardViewDashboardController: React.FC<DashboardViewProps> = ({ dashboardId }) => {
  const isAnonymousUser = useUserConfigContextSelector((state) => state.isAnonymousUser);
  const { dashboardResponse: dashboardResponse } = useBusterDashboardIndividual({
    dashboardId
  });
  const onUpdateDashboard = useDashboardContextSelector((x) => x.onUpdateDashboard);
  const onUpdateDashboardConfig = useDashboardContextSelector((x) => x.onUpdateDashboardConfig);
  const setOpenAddContentModal = useDashboardContextSelector((x) => x.setOpenAddContentModal);

  const metrics = dashboardResponse?.metrics;
  const dashboard = dashboardResponse?.dashboard;
  const allowEdit = dashboardResponse?.permission !== ShareRole.VIEWER && !isAnonymousUser;

  const onOpenAddContentModal = useMemoizedFn(() => {
    setOpenAddContentModal(true);
  });

  return (
    <div className="flex flex-col space-y-3 overflow-y-auto p-10">
      <DashboardEditTitles
        onUpdateDashboard={onUpdateDashboard}
        allowEdit={allowEdit}
        title={dashboardResponse?.dashboard?.title || ''}
        description={dashboardResponse?.dashboard?.description || ''}
      />

      <DashboardContentController
        metrics={metrics}
        dashboard={dashboard}
        onUpdateDashboardConfig={onUpdateDashboardConfig}
        openAddContentModal={onOpenAddContentModal}
      />
    </div>
  );
};
