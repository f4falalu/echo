import { type QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import { useBusterNotifications } from '@/context/BusterNotifications';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection,
} from '../../collections/queryRequests';

/**
 * useAddDashboardToCollection
 */
export const useAddDashboardToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const mutationFn = async (variables: { dashboardIds: string[]; collectionIds: string[] }) => {
    const { dashboardIds, collectionIds } = variables;
    return await Promise.all(
      collectionIds.map((collectionId) =>
        addAssetToCollection({
          id: collectionId,
          assets: dashboardIds.map((dashboardId) => ({ id: dashboardId, type: 'dashboard' })),
        })
      )
    );
  };
  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      variables.dashboardIds.forEach((dashboardId) => {
        queryClient.setQueryData(
          //this might cause problems if the dashboard is not the latest version...
          dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST').queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return create(oldData, (draft) => {
              draft.collections = [
                ...(draft.collections || []),
                ...variables.collectionIds.map((id) => ({ id, name: '' })),
              ];
            });
          }
        );
      });
    },
    onSuccess: (_, { collectionIds, dashboardIds }) => {
      refreshCollectionsAndDashboards(queryClient, { collectionIds, dashboardIds });
    },
  });
};

/**
 * useRemoveDashboardFromCollection
 */
export const useRemoveDashboardFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();
  const { openErrorMessage } = useBusterNotifications();

  const mutationFn = async (variables: { dashboardIds: string[]; collectionIds: string[] }) => {
    const { dashboardIds, collectionIds } = variables;
    return await Promise.all(
      collectionIds.map((collectionId) =>
        removeAssetFromCollection({
          id: collectionId,
          assets: dashboardIds.map((dashboardId) => ({ id: dashboardId, type: 'dashboard' })),
        })
      )
    );
  };
  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      variables.dashboardIds.forEach((dashboardId) => {
        queryClient.setQueryData(
          //this might cause problems if the dashboard is not the latest version...
          dashboardQueryKeys.dashboardGetDashboard(dashboardId, 'LATEST').queryKey,
          (oldData) => {
            if (!oldData) return oldData;
            return create(oldData, (draft) => {
              draft.collections = draft.collections?.filter(
                (c) => !variables.collectionIds.includes(c.id)
              );
            });
          }
        );
      });
    },
    onSuccess: (data, { collectionIds, dashboardIds }) => {
      refreshCollectionsAndDashboards(queryClient, { collectionIds, dashboardIds });

      const hasFailed = data.some((d) => d.failed_assets.length > 0);

      if (hasFailed) {
        data.forEach((d) => {
          if (d.failed_assets.length > 0) {
            d.failed_assets.forEach((a) => {
              openErrorMessage(`Failed to remove ${a.type} from collection - ${a.error}`);
            });
          }
        });
        throw new Error('Failed to remove dashboard from collection');
      }
    },
  });
};

const refreshCollectionsAndDashboards = (
  queryClient: QueryClient,
  { collectionIds, dashboardIds }: { collectionIds: string[]; dashboardIds: string[] }
) => {
  collectionIds.forEach((id) => {
    queryClient.invalidateQueries({
      queryKey: collectionQueryKeys.collectionsGetCollection(id).queryKey,
      refetchType: 'all',
    });
  });
  dashboardIds.forEach((id) => {
    queryClient.invalidateQueries({
      queryKey: dashboardQueryKeys.dashboardGetDashboard(id, 'LATEST').queryKey,
      refetchType: 'all',
    });
  });
};
