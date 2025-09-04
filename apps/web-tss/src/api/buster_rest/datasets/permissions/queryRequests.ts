import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { datasetGroupQueryKeys } from '@/api/query_keys/dataset_groups';
import { datasetQueryKeys } from '@/api/query_keys/datasets';
import {
  getDatasetPermissionsOverview,
  listDatasetDatasetGroups,
  listDatasetPermissionUsers,
  listIndividualDatasetPermissionGroups,
  updateDatasetDatasetGroups,
  updateDatasetPermissionGroups,
  updateDatasetPermissionUsers,
} from './requests';

export const useGetDatasetPermissionsOverview = (dataset_id: string) => {
  const queryFn = () => {
    return getDatasetPermissionsOverview({ dataset_id });
  };

  return useQuery({
    ...datasetGroupQueryKeys.datasetPermissionsOverview(dataset_id),
    queryFn,
  });
};

export const prefetchGetDatasetPermissionsOverview = async (
  datasetId: string,
  queryClient: QueryClient
) => {
  await queryClient.prefetchQuery({
    ...datasetGroupQueryKeys.datasetPermissionsOverview(datasetId),
    queryFn: () => getDatasetPermissionsOverview({ dataset_id: datasetId }),
  });
  return queryClient;
};

export const useDatasetListPermissionGroups = (dataset_id: string) => {
  const queryFn = () => {
    return listIndividualDatasetPermissionGroups({ dataset_id });
  };

  return useQuery({
    ...datasetGroupQueryKeys.datasetPermissionGroupsList(dataset_id),
    queryFn,
    enabled: !!dataset_id,
  });
};

export const useDatasetUpdatePermissionGroups = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDatasetPermissionGroups,
    onMutate: ({ dataset_id, groups }) => {
      queryClient.setQueryData(
        datasetGroupQueryKeys.datasetPermissionGroupsList(dataset_id).queryKey,
        (oldData) => {
          const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
          for (const { id, assigned } of groups) {
            keyedChanges[id] = { id, assigned };
          }
          const newData =
            oldData?.map((group) => {
              const updatedGroup = keyedChanges[group.id];
              if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
              return group;
            }) || [];
          return newData;
        }
      );
    },
    onSettled: (_, __, { dataset_id }) => {
      queryClient.invalidateQueries({
        queryKey: datasetGroupQueryKeys.datasetPermissionGroupsList(dataset_id).queryKey,
        refetchType: 'all',
      });
    },
  });
};

export const useDatasetListDatasetGroups = (dataset_id: string) => {
  const queryFn = () => listDatasetDatasetGroups({ dataset_id });

  return useQuery({
    ...datasetGroupQueryKeys.datasetGroupsList,
    queryFn,
    enabled: !!dataset_id,
  });
};

export const useDatasetListPermissionUsers = (dataset_id: string) => {
  const queryFn = () => listDatasetPermissionUsers({ dataset_id });

  return useQuery({
    ...datasetGroupQueryKeys.datasetPermissionUsersList(dataset_id),
    queryFn,
    enabled: !!dataset_id,
  });
};

export const useDatasetUpdateDatasetGroups = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDatasetDatasetGroups,
    onMutate: ({ groups }) => {
      const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
      for (const { id, assigned } of groups) {
        keyedChanges[id] = { id, assigned };
      }
      queryClient.setQueryData(datasetGroupQueryKeys.datasetGroupsList.queryKey, (oldData) => {
        return (
          oldData?.map((group) => {
            const updatedGroup = keyedChanges[group.id];
            if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
            return group;
          }) || []
        );
      });
    },
  });
};

export const useDatasetUpdatePermissionUsers = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = (users: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    for (const { id, assigned } of users) {
      keyedChanges[id] = { id, assigned };
    }
    queryClient.setQueryData(
      datasetGroupQueryKeys.datasetPermissionUsersList(dataset_id).queryKey,
      (oldData) => {
        return (
          oldData?.map((user) => {
            const updatedUser = keyedChanges[user.id];
            if (updatedUser) return { ...user, assigned: updatedUser.assigned };
            return user;
          }) || []
        );
      }
    );
    return updateDatasetPermissionUsers({ dataset_id, users });
  };

  return useMutation({
    mutationFn,
  });
};
