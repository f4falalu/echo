import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useMemoizedFn } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';

export const useGetDashboardMemoized = () => {
  const queryClient = useQueryClient();
  const getDashboardMemoized = useMemoizedFn((dashboardId: string) => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId);
    const data = queryClient.getQueryData(options.queryKey);
    return data;
  });
  return getDashboardMemoized;
};
