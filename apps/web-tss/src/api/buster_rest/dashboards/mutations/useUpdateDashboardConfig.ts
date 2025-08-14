import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import type { BusterDashboard } from '@/api/asset_interfaces/dashboard';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useGetLatestDashboardVersionMemoized } from '../dashboardVersionNumber';
import { useSaveDashboard } from './useSaveDashboard';

/**
 * useUpdateDashboardConfig
 * Client-optmistic update for the dashboard.config field, then persists.
 */
export const useUpdateDashboardConfig = () => {
  const { mutateAsync } = useSaveDashboard({
    updateOnSave: true,
  });
  const queryClient = useQueryClient();
  const getLatestDashboardVersion = useGetLatestDashboardVersionMemoized();

  const method = async ({
    dashboardId,
    ...newDashboard
  }: Partial<BusterDashboard['config']> & {
    dashboardId: string;
  }) => {
    const latestVersionNumber = getLatestDashboardVersion(dashboardId) ?? 'LATEST';
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, latestVersionNumber);
    const previousDashboard = queryClient.getQueryData(options.queryKey);
    const previousConfig = previousDashboard?.dashboard?.config;
    if (previousConfig) {
      const newConfig = create(previousConfig, (draft) => {
        Object.assign(draft, newDashboard);
      });
      return mutateAsync({
        id: dashboardId,
        config: newConfig,
      });
    }
  };

  return useMutation({
    mutationFn: method,
  });
};
