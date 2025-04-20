import { useQueryClient } from '@tanstack/react-query';
import { useOriginalDashboardStore } from './useOriginalDashboardStore';
import { useMemoizedFn } from '@/hooks';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { BusterDashboardResponse } from '@/api/asset_interfaces/dashboard';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { compareObjectsByKeys } from '@/lib/objects';
import { useMemo } from 'react';
import { create } from 'mutative';

export const useIsDashboardChanged = ({ dashboardId }: { dashboardId: string | undefined }) => {
  const queryClient = useQueryClient();
  const originalDashboard = useOriginalDashboardStore((x) => x.getOriginalDashboard(dashboardId));

  const { data: currentDashboard, refetch: refetchCurrentDashboard } = useGetDashboard(
    { id: dashboardId, versionNumber: undefined },
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
    const options = dashboardQueryKeys.dashboardGetDashboard(
      dashboardId || '',
      originalDashboard?.version_number || null
    );
    const currentDashboard = queryClient.getQueryData<BusterDashboardResponse>(options.queryKey);
    if (originalDashboard && currentDashboard) {
      const resetDashboard = create(currentDashboard, (draft) => {
        Object.assign(draft, originalDashboard);
      });
      queryClient.setQueryData(options.queryKey, resetDashboard);
    }
    refetchCurrentDashboard();
  });

  const isDashboardChanged = useMemo(() => {
    return (
      !originalDashboard ||
      !currentDashboard ||
      !compareObjectsByKeys(originalDashboard, currentDashboard, [
        'name',
        'description',
        'config',
        'file'
      ])
    );
  }, [originalDashboard, currentDashboard]);

  return {
    onResetDashboardToOriginal,
    isDashboardChanged
  };
};
