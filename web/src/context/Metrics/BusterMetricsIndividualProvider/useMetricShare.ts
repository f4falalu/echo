import { useMemoizedFn } from 'ahooks';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import type { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { BusterMetric } from '@/api/asset_interfaces';

export const useShareMetric = ({
  onInitializeMetric
}: {
  onInitializeMetric: (metric: BusterMetric) => void;
}) => {
  const busterSocket = useBusterWebSocket();

  const onShareMetric = useMemoizedFn(
    async (
      payload: Pick<
        MetricUpdateMetric['payload'],
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
      //keep this seperate from _updateMetricToServer because we need to do some extra stuff
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/metrics/update',
          payload
        },
        responseEvent: {
          route: '/metrics/update:updateMetricState',
          callback: onInitializeMetric
        }
      });
    }
  );

  return {
    onShareMetric
  };
};
