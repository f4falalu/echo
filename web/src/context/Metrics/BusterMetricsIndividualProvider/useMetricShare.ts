import { useMemoizedFn } from 'ahooks';
import type { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { useUpdateMetricConfig } from './useMetricUpdateConfig';

export const useShareMetric = ({
  updateMetricMutation
}: {
  updateMetricMutation: ReturnType<typeof useUpdateMetricConfig>['updateMetricMutation'];
}) => {
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
      return updateMetricMutation(payload);
    }
  );

  return {
    onShareMetric
  };
};
