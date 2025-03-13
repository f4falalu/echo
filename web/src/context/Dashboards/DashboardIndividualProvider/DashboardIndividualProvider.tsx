'use client';

import React, { PropsWithChildren } from 'react';
import { useMemoizedFn } from '@/hooks';
import { createContext, useContextSelector } from 'use-context-selector';
import { queryKeys } from '@/api/query_keys';
import { useDashboardAssosciations } from './useDashboardAssosciations';
import { useQueryClient } from '@tanstack/react-query';

export const useBusterDashboards = () => {
  const queryClient = useQueryClient();

  const getDashboardMemoized = useMemoizedFn((dashboardId: string) => {
    const options = queryKeys.dashboardGetDashboard(dashboardId);
    const queryKey = options.queryKey;
    return queryClient.getQueryData(queryKey);
  });

  const dashboardAssosciations = useDashboardAssosciations({
    getDashboardMemoized
  });

  return {
    ...dashboardAssosciations,
    getDashboardMemoized
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
  selector: (state: ReturnType<typeof useBusterDashboards>) => T
) => useContextSelector(BusterDashboards, selector);
