import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { setOriginalDashboard } from '@/context/Dashboards/useOriginalDashboardStore';
import { dashboardsUpdateDashboard } from '../requests';

/**
 * useSaveDashboard
 * Saves the dashboard to the server and updates cache optionally.
 */
export const useSaveDashboard = (params?: { updateOnSave?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: dashboardsUpdateDashboard,
    onSuccess: (data, variables) => {
      if (updateOnSave && data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
        setOriginalDashboard(data.dashboard);

        if (variables.restore_to_version) {
          queryClient.invalidateQueries({
            queryKey: dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, 'LATEST')
              .queryKey,
          });
        }
      }
    },
  });
};
