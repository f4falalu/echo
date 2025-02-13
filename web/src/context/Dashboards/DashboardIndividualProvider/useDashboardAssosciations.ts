import { useMemoizedFn } from 'ahooks';
import { type BusterDashboardResponse } from '@/api/asset_interfaces';
import { useDashboardUpdateConfig } from './useDashboardUpdateConfig';

export const useDashboardAssosciations = ({
  getDashboardMemoized,
  updateDashboardMutation
}: {
  getDashboardMemoized: (dashboardId: string) => BusterDashboardResponse | undefined;
  updateDashboardMutation: ReturnType<typeof useDashboardUpdateConfig>['updateDashboardMutation'];
}) => {
  const onAddToCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId: string;
    }) => {
      updateDashboardMutation({
        id: dashboardId,
        add_to_collections: typeof collectionId === 'string' ? [collectionId] : collectionId
      });
    }
  );

  const onRemoveFromCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId: string;
    }) => {
      updateDashboardMutation({
        id: dashboardId,
        remove_from_collections: typeof collectionId === 'string' ? [collectionId] : collectionId
      });
    }
  );

  const onBulkAddRemoveToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { dashboardId: string; metricIds: string[] }) => {
      updateDashboardMutation({
        id: dashboardId,
        metrics: metricIds
      });
    }
  );

  const removeItemFromIndividualDashboard = useMemoizedFn(
    ({ dashboardId, metricId }: { dashboardId: string; metricId: string }) => {
      const prev = getDashboardMemoized(dashboardId);
      if (!prev) return;

      const newMetrics = prev.metrics.filter((t) => t.id !== metricId);

      //TODO: do I need to update the config for rows?
      updateDashboardMutation({
        id: dashboardId,
        metrics: newMetrics.map((t) => t.id)
      });
    }
  );

  return {
    removeItemFromIndividualDashboard,
    onAddToCollection,
    onRemoveFromCollection,
    onBulkAddRemoveToDashboard
  };
};
