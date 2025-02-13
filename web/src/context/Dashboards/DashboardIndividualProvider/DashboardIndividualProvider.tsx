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
import { useDashboardUpdateConfig } from './useDashboardUpdateConfig';
import { createQueryKey } from '@/hooks';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';

export const useBusterDashboards = () => {
  const [openAddContentModal, setOpenAddContentModal] = useState(false);
  const queryClient = useQueryClient();
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  const getDashboard = useQuery({
    queryKey: ['/dashboards/get:getDashboardState', { id: '1' }],
    queryFn: () => {
      return { id: '1' };
    },
    enabled: false
  });

  const getDashboardMemoized = useMemoizedFn((dashboardId: string) => {
    const { password } = getAssetPassword(dashboardId);
    const queryKey = createQueryKey(
      { route: '/dashboards/get:getDashboardState' },
      { route: '/dashboards/get', payload: { id: dashboardId, password } }
    );
    return queryClient.getQueryData<BusterDashboardResponse>(queryKey);
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
