import {
  type BusterDashboard,
  type BusterDashboardResponse,
  type VerificationStatus
} from '@/api/asset_interfaces';
import { useMemoizedFn } from '@/hooks';
import { create } from 'mutative';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';
import type { DashboardUpdateRequest } from '@/api/request_interfaces/dashboards/interfaces';

export const useDashboardUpdateConfig = ({
  getDashboardMemoized
}: {
  getDashboardMemoized: (dashboardId: string) => BusterDashboardResponse | undefined;
}) => {
  const { mutateAsync: updateDashboardMutation, isPending: isUpdatingDashboard } =
    useUpdateDashboard();

  const onUpdateDashboard = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard> & { id: string }) => {
      const currentDashboard = getDashboardMemoized(newDashboard.id);
      const newDashboardState: BusterDashboard = create(currentDashboard?.dashboard!, (draft) => {
        Object.assign(draft, newDashboard);
      });
      return updateDashboardMutation({
        id: newDashboard.id,
        name: newDashboardState.name,
        description: newDashboardState.description,
        config: newDashboardState.config
      });
    }
  );

  const onShareDashboard = useMemoizedFn(
    async (
      props: Pick<
        DashboardUpdateRequest,
        | 'id'
        | 'publicly_accessible'
        | 'public_password'
        | 'user_permissions'
        | 'team_permissions'
        | 'public_expiry_date'
        | 'remove_users'
        | 'remove_teams'
      >
    ) => {
      return updateDashboardMutation(props);
    }
  );

  const onUpdateDashboardConfig = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard['config']>, dashboardId: string) => {
      const currentDashboard = getDashboardMemoized(dashboardId);
      const newDashboardState: BusterDashboard = create(currentDashboard?.dashboard!, (draft) => {
        Object.assign(draft.config, newDashboard);
      });
      return onUpdateDashboard(newDashboardState);
    }
  );

  const onVerifiedDashboard = useMemoizedFn(
    async ({ dashboardId, status }: { dashboardId: string; status: VerificationStatus }) => {
      return onUpdateDashboard({
        id: dashboardId,
        status
      });
    }
  );

  return {
    isUpdatingDashboard,
    updateDashboardMutation,
    onShareDashboard,
    onUpdateDashboardConfig,
    onUpdateDashboard,
    onVerifiedDashboard
  };
};
