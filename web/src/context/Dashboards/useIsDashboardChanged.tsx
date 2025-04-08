import { useQueryClient } from '@tanstack/react-query';
import { useOriginalDashboardStore } from './useOriginalDashboardStore';
import { useMemoizedFn } from '@/hooks';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { compareObjectsByKeys } from '@/lib/objects';

export const useIsDashboardChanged = ({ dashboardId }: { dashboardId: string }) => {
  const queryClient = useQueryClient();
  const originalDashboard = useOriginalDashboardStore((x) => x.getOriginalDashboard(dashboardId));

  const { data: currentDashboard, refetch: refetchCurrentDashboard } = useGetDashboard(
    { id: dashboardId },
    {
      select: (x) => ({
        name: x.dashboard.name,
        description: x.dashboard.description,
        config: x.dashboard.config,
        file: x.dashboard.file
      })
    }
  );

  const onResetDashboardToOriginal = useMemoizedFn(() => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId);
    const currentDashboard = queryClient.getQueryData<BusterDashboardResponse>(options.queryKey);
    if (originalDashboard && currentDashboard) {
      queryClient.setQueryData(options.queryKey, {
        ...currentDashboard,
        dashboard: originalDashboard
      });
    }
    refetchCurrentDashboard();
  });

  return {
    onResetDashboardToOriginal,
    isDashboardChanged:
      !originalDashboard ||
      !currentDashboard ||
      !compareObjectsByKeys(originalDashboard, currentDashboard, [
        'name',
        'description',
        'config',
        'file'
      ])
  };
};
