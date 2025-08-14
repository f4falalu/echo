import { useMutation, useQueryClient } from '@tanstack/react-query';
import { collectionQueryKeys } from '@/api/query_keys/collection';
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
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all',
      });
    },
  });
};

/**
 * useRemoveDashboardFromCollection
 */
export const useRemoveDashboardFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();

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
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        ),
        refetchType: 'all',
      });
    },
  });
};
