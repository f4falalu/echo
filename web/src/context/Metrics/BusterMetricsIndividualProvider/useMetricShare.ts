import { useMemoizedFn } from '@/hooks';
import type { useUpdateMetricConfig } from './useMetricUpdateConfig';
import type { UpdateMetricParams } from '@/api/buster_rest/metrics';

export const useShareMetric = ({
  updateMetricMutation
}: {
  updateMetricMutation: ReturnType<typeof useUpdateMetricConfig>['updateMetricMutation'];
}) => {
  const onShareMetric = useMemoizedFn(
    async (
      payload: Pick<
        UpdateMetricParams,
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
