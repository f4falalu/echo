'use client';

import { DashboardViewProps } from '../config';
import React from 'react';
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
  const { data: dashboardResponse } = useGetDashboard(dashboardId);
  const { mutateAsync: onUpdateDashboard } = useUpdateDashboard();
  const { mutateAsync: onUpdateDashboardConfig } = useUpdateDashboardConfig();

  const onOpenAddContentModal = useMemoizedFn(() => {
    console.log('open add content modal');
  });

  const metrics = dashboardResponse?.metrics;
  const dashboard = dashboardResponse?.dashboard;

  return (
    <div className="flex h-full flex-col space-y-3 overflow-y-auto p-10">
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
