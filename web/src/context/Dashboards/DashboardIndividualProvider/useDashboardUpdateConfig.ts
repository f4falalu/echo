import type {
  BusterDashboard,
  BusterDashboardResponse,
  VerificationStatus
} from '@/api/asset_interfaces';
import { DashboardUpdate } from '@/api/buster_socket/dashboards';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useSocketQueryMutation } from '@/hooks';
import { useMemoizedFn } from 'ahooks';
import { create } from 'mutative';

export const useDashboardUpdateConfig = ({
  getDashboardMemoized
}: {
  getDashboardMemoized: (dashboardId: string) => BusterDashboardResponse | undefined;
}) => {
  const busterSocket = useBusterWebSocket();

  const { mutateAsync: updateDashboard, isPending: isUpdatingDashboard } = useSocketQueryMutation(
    { route: '/dashboards/update' },
    { route: '/dashboards/update:updateDashboard' },
    {
      preSetQueryDataFunction: {
        responseRoute: '/dashboards/get:getDashboardState',
        callback: (data, variables) => {
          const newObject: BusterDashboardResponse = create(data!, (draft) => {
            Object.assign(draft.dashboard, variables, {
              config: { ...draft.dashboard.config, ...variables.config }
            });
          });
          return newObject;
        }
      }
    }
  );

  const onUpdateDashboard = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard> & { id: string }) => {
      const currentDashboard = getDashboardMemoized(newDashboard.id);
      const newDashboardState: BusterDashboard = create(currentDashboard?.dashboard!, (draft) => {
        Object.assign(draft, newDashboard);
      });
      return updateDashboard({
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
      return updateDashboard(props);
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

  const refreshDashboard = useMemoizedFn((dashboardId: string) => {
    busterSocket.emit({ route: '/dashboards/get', payload: { id: dashboardId } });
  });

  return {
    onShareDashboard,
    onUpdateDashboardConfig,
    onUpdateDashboard,
    onVerifiedDashboard,
    refreshDashboard
  };
};
