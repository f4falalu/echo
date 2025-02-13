import { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useMemoizedFn } from 'ahooks';
import React, { useEffect } from 'react';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useSocketQueryEmitOn } from '@/hooks';

export const useBusterDashboardIndividual = ({
  dashboardId = ''
}: {
  dashboardId: string | undefined;
}) => {
  const onInitializeMetric = useBusterMetricsIndividualContextSelector(
    (state) => state.onInitializeMetric
  );
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password } = getAssetPassword(dashboardId);

  const { data: dashboardResponse, refetch: refreshDashboard } = useSocketQueryEmitOn(
    { route: '/dashboards/get', payload: { id: dashboardId, password } },
    { route: '/dashboards/get:getDashboardState' },
    { enabled: !!dashboardId }
  );

  const initializeDashboard = useMemoizedFn((d: BusterDashboardResponse) => {
    const metrics = d.metrics;

    for (const metric of metrics) {
      onInitializeMetric(metric);
    }
  });

  useEffect(() => {
    if (dashboardResponse) {
      initializeDashboard(dashboardResponse);
    }
  }, [dashboardResponse]);

  const dashboard = dashboardResponse?.dashboard;
  const metrics = dashboardResponse?.metrics || [];

  return {
    dashboard,
    metrics,
    dashboardResponse,
    refreshDashboard
  };
};
