import { DashboardUpdate } from '@/api/buster_socket/dashboards';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';

export const useShareDashboard = () => {
  const busterSocket = useBusterWebSocket();

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
      return busterSocket.emit({
        route: '/dashboards/update',
        payload: props
      });
    }
  );

  return {
    onShareDashboard
  };
};
