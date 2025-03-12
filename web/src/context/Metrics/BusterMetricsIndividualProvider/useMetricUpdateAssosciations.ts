import { useMemoizedFn } from '@/hooks';
import type { IBusterMetric } from '@/api/asset_interfaces/metric';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useUpdateMetricConfig } from './useMetricUpdateConfig';
import { useGetUserFavorites } from '@/api/buster_rest/users';
export const useUpdateMetricAssosciations = ({
  getMetricMemoized,
  updateMetricMutation
}: {
  getMetricMemoized: ({ metricId }: { metricId?: string }) => IBusterMetric;
  updateMetricMutation: ReturnType<typeof useUpdateMetricConfig>['updateMetricMutation'];
}) => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const { openConfirmModal } = useBusterNotifications();

  const saveMetricToDashboard = useMemoizedFn(
    async ({ metricId, dashboardIds }: { metricId: string; dashboardIds: string[] }) => {
      await updateMetricMutation({
        id: metricId,
        save_to_dashboard: dashboardIds
      });
    }
  );

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricId, collectionIds }: { metricId: string; collectionIds: string[] }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return collectionIds.includes(searchId);
      });

      await updateMetricMutation({
        id: metricId,
        add_to_collections: collectionIds
      });

      if (collectionIsInFavorites) {
        await refreshFavoritesList();
      }
    }
  );

  const removeMetricFromDashboard = useMemoizedFn(
    async ({
      metricId,
      dashboardId,
      useConfirmModal = true
    }: {
      metricId: string;
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const method = async () => {
        await updateMetricMutation({
          id: metricId,
          remove_from_dashboard: [dashboardId]
        });
      };

      if (!useConfirmModal) return await method();

      return await openConfirmModal({
        title: 'Remove from dashboard',
        content: 'Are you sure you want to remove this metric from this dashboard?',
        onOk: method
      });
    }
  );

  const removeMetricFromCollection = useMemoizedFn(
    async ({ metricId, collectionId }: { metricId: string; collectionId: string }) => {
      const currentMetric = getMetricMemoized({ metricId });
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return currentMetric.collections.some((c) => c.id === searchId);
      });

      await updateMetricMutation({
        id: metricId,
        remove_from_collections: [collectionId]
      });

      if (collectionIsInFavorites) {
        await refreshFavoritesList();
      }
    }
  );

  return {
    saveMetricToDashboard,
    saveMetricToCollection,
    removeMetricFromDashboard,
    removeMetricFromCollection
  };
};
