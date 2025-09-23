import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import type { BusterDashboardResponse } from '../../asset_interfaces/dashboard/interfaces';
import { dashboardQueryKeys } from '../../query_keys/dashboard';

const stableVersionDataSelector = (data: BusterDashboardResponse) => data.dashboard.version_number;
const stableVersionSearchSelector = (state: { dashboard_version_number?: number | undefined }) =>
  state.dashboard_version_number;

export const useGetDashboardVersionNumber = (
  dashboardId: string,
  versionNumber: number | 'LATEST' = 'LATEST'
) => {
  const { data: latestVersionNumber } = useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST'),
    enabled: false,
    select: stableVersionDataSelector,
  });

  // Get the dashboard_version_number query param from the route
  const paramVersionNumber = useSearch({
    select: stableVersionSearchSelector,
    strict: false,
  });

  const isLatest = versionNumber === 'LATEST' || latestVersionNumber === versionNumber;

  const selectedVersionNumber = isLatest
    ? ('LATEST' as const)
    : (versionNumber ?? paramVersionNumber ?? 'LATEST');

  return useMemo(
    () => ({
      selectedVersionNumber,
      latestVersionNumber,
      paramVersionNumber,
    }),
    [latestVersionNumber, selectedVersionNumber, paramVersionNumber]
  );
};

export const useGetLatestDashboardVersionMemoized = () => {
  const queryClient = useQueryClient();

  return useCallback((dashboardId: string) => {
    const data = queryClient.getQueryData(
      dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST').queryKey
    );
    return data?.dashboard.version_number;
  }, []);
};
