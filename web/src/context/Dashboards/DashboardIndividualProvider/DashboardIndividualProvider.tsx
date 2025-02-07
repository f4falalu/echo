import React, { PropsWithChildren, useLayoutEffect, useState } from 'react';
import { useMemoizedFn, useUnmount } from 'ahooks';
import {
  useContextSelector,
  createContext,
  ContextSelector
} from '@fluentui/react-context-selector';
import { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useDashboardAssosciations } from './useDashboardAssosciations';
import { useDashboardCreate } from './useDashboardCreate';
import { useShareDashboard } from './useDashboardShare';
import { useDashboardSubscribe } from './useDashboardSubscribe';
import { useDashboardUpdateConfig } from './useDashboardUpdateConfig';

export const useBusterDashboards = () => {
  const [openAddContentModal, setOpenAddContentModal] = useState(false);

  const [dashboards, setDashboard] = useState<Record<string, BusterDashboardResponse>>({});

  const dashboardShare = useShareDashboard();

  const dashboardSubscribe = useDashboardSubscribe({ setDashboard });

  const dashboardUpdateConfig = useDashboardUpdateConfig({ dashboards, setDashboard });

  const dashboardAssosciations = useDashboardAssosciations({ setDashboard });

  const dashboardCreate = useDashboardCreate({
    onUpdateDashboard: dashboardUpdateConfig.onUpdateDashboard
  });

  const getDashboardMemoized = useMemoizedFn((id: string) => dashboards[id]);

  return {
    ...dashboardAssosciations,
    ...dashboardCreate,
    ...dashboardUpdateConfig,
    ...dashboardSubscribe,
    ...dashboardShare,
    dashboards,
    openAddContentModal,
    getDashboardMemoized,
    setOpenAddContentModal
  };
};

export const BusterDashboards = createContext<ReturnType<typeof useBusterDashboards>>(
  {} as ReturnType<typeof useBusterDashboards>
);

export const BusterDashboardIndividualProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const dashboards = useBusterDashboards();

  return <BusterDashboards.Provider value={dashboards}>{children}</BusterDashboards.Provider>;
};

export const useBusterDashboardContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterDashboards>, T>
) => useContextSelector(BusterDashboards, selector);

export const useBusterDashboardIndividual = ({
  dashboardId
}: {
  dashboardId: string | undefined;
}) => {
  const dashboardResponse = useBusterDashboardContextSelector(
    (state) => state.dashboards[dashboardId || '']
  );
  const subscribeToDashboard = useBusterDashboardContextSelector(
    (state) => state.subscribeToDashboard
  );
  const unSubscribeToDashboard = useBusterDashboardContextSelector((x) => x.unSubscribeToDashboard);

  useLayoutEffect(() => {
    if (dashboardId) subscribeToDashboard({ dashboardId });
  }, [dashboardId]);

  useUnmount(() => {
    if (dashboardId) unSubscribeToDashboard({ dashboardId });
  });

  const dashboard = dashboardResponse?.dashboard;
  const metrics = dashboardResponse?.metrics;

  return {
    dashboard,
    metrics,
    dashboardResponse
  };
};
