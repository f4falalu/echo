import { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn, useMount } from 'ahooks';
import React, { useEffect, useRef } from 'react';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useSocketQueryEmitOn } from '@/hooks';

export const useDashboardIndividual = ({ dashboardId }: { dashboardId: string }) => {
  const onInitializeMetric = useBusterMetricsIndividualContextSelector(
    (state) => state.onInitializeMetric
  );
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password } = getAssetPassword(dashboardId);

  const { data, refetch: refreshDashboard } = useSocketQueryEmitOn(
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
    if (data) {
      initializeDashboard(data);
    }
  }, [data]);

  return {
    refreshDashboard,
    initializeDashboard
  };
};
