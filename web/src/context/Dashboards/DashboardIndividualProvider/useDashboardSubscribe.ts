import { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn, useMount } from 'ahooks';
import React, { useRef } from 'react';
import { MOCK_DASHBOARD_RESPONSE } from './MOCK_DASHBOARD';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';

export const useDashboardSubscribe = ({
  setDashboard
}: {
  setDashboard: React.Dispatch<React.SetStateAction<Record<string, BusterDashboardResponse>>>;
}) => {
  const busterSocket = useBusterWebSocket();
  const onInitializeMetric = useBusterMetricsIndividualContextSelector(
    (state) => state.onInitializeMetric
  );
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const dashboardsSubscribed = useRef<Record<string, boolean>>({});

  const _onGetDashboardState = useMemoizedFn((d: BusterDashboardResponse) => {
    const metrics = d.metrics;

    for (const metric of metrics) {
      onInitializeMetric(metric);
    }

    setDashboard((prevDashboards) => {
      return {
        ...prevDashboards,
        [d.dashboard.id]: d
      };
    });
  });

  const refreshDashboard = useMemoizedFn(async (dashboardId: string) => {
    const { password } = getAssetPassword(dashboardId);
    busterSocket.emit({
      route: '/dashboards/get',
      payload: {
        id: dashboardId,
        password
      }
    });
  });

  const subscribeToDashboard = useMemoizedFn(({ dashboardId }: { dashboardId: string }) => {
    if (dashboardId && !dashboardsSubscribed.current[dashboardId]) {
      refreshDashboard(dashboardId);
      dashboardsSubscribed.current[dashboardId] = true;
    }
  });

  const unSubscribeToDashboard = useMemoizedFn(({ dashboardId }: { dashboardId: string }) => {
    busterSocket.emit({
      route: '/dashboards/unsubscribe',
      payload: {
        id: dashboardId
      }
    });
    dashboardsSubscribed.current[dashboardId] = false;
  });

  useMount(() => {
    setTimeout(() => {
      _onGetDashboardState(MOCK_DASHBOARD_RESPONSE);
    }, 500);

    busterSocket.on({
      route: '/dashboards/get:getDashboardState',
      callback: _onGetDashboardState
    });
  });

  return {
    subscribeToDashboard,
    unSubscribeToDashboard,
    refreshDashboard
  };
};
