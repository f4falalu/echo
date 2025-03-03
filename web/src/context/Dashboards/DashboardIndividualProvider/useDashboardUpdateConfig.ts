import {
  type BusterDashboard,
  type BusterDashboardResponse,
  type VerificationStatus
} from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';

import { DashboardUpdate } from '@/api/buster_socket/dashboards';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { useMemoizedFn } from 'ahooks';
import { create } from 'mutative';
import { useQueryClient } from '@tanstack/react-query';

export const useDashboardUpdateConfig = ({
  getDashboardMemoized
}: {
  getDashboardMemoized: (dashboardId: string) => BusterDashboardResponse | undefined;
}) => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateDashboardMutation, isPending: isUpdatingDashboard } =
    useSocketQueryMutation({
      emitEvent: '/dashboards/update',
      responseEvent: '/dashboards/update:updateDashboard',
      preCallback: (_, variables) => {
        const options = queryKeys['/dashboards/get:getDashboardState'](variables.id);
        const queryKey = options.queryKey;
        const currentData = getDashboardMemoized(variables.id);
        if (currentData) {
          const newObject: BusterDashboardResponse = create(currentData, (draft) => {
            Object.assign(draft.dashboard, variables, {
              config: { ...draft.dashboard.config, ...variables.config }
            });
          });

          if (variables.add_to_collections) {
            // currentData.collections.push({
            //   id: collectionId,
            //   name: 'New Collection'
            // });
            // queryClient.setQueryData(queryKey, currentData);
          }

          if (variables.remove_from_collections) {
            //
          }

          queryClient.setQueryData(queryKey, newObject);
        }
        return null;
      }
    });

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
        DashboardUpdate['payload'],
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
