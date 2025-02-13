import React, { PropsWithChildren, useState } from 'react';
import { useMemoizedFn } from 'ahooks';
import {
  useContextSelector,
  createContext,
  ContextSelector
} from '@fluentui/react-context-selector';
import { queryKeys } from '@/api/asset_interfaces';
import { useDashboardAssosciations } from './useDashboardAssosciations';
import { useDashboardCreate } from './useDashboardCreate';
import { useDashboardUpdateConfig } from './useDashboardUpdateConfig';
import { useQueryClient } from '@tanstack/react-query';

export const useBusterDashboards = () => {
  const [openAddContentModal, setOpenAddContentModal] = useState(false);
  const queryClient = useQueryClient();

  const getDashboardMemoized = useMemoizedFn((dashboardId: string) => {
    const options = queryKeys['/dashboards/get:getDashboardState'](dashboardId);
    const queryKey = options.queryKey;
    const data = queryClient.getQueryData(queryKey);
    return data;
  });

  const dashboardUpdateConfig = useDashboardUpdateConfig({ getDashboardMemoized });

  const dashboardAssosciations = useDashboardAssosciations();

  const dashboardCreate = useDashboardCreate({
    onUpdateDashboard: dashboardUpdateConfig.onUpdateDashboard
  });

  return {
    ...dashboardAssosciations,
    ...dashboardCreate,
    ...dashboardUpdateConfig,
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
