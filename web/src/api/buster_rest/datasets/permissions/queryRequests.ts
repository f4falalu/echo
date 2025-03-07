import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getDatasetPermissionsOverview,
  listDatasetDatasetGroups,
  listIndividualDatasetPermissionGroups,
  updateDatasetPermissionGroups,
  updateDatasetDatasetGroups,
  updateDatasetPermissionUsers,
  listDatasetPermissionUsers,
  getDatasetPermissionsOverview_server
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';

export const useGetDatasetPermissionsOverview = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => {
    return getDatasetPermissionsOverview({ dataset_id });
  });

  return useQuery({
    ...queryKeys.datasetPermissionsOverview(dataset_id),
    queryFn
  });
};

export const prefetchGetDatasetPermissionsOverview = async (
  datasetId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.datasetPermissionsOverview(datasetId),
    queryFn: () => getDatasetPermissionsOverview_server(datasetId)
  });
  return queryClient;
};

export const useDatasetListPermissionGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => {
    return listIndividualDatasetPermissionGroups({ dataset_id });
  });

  return useQuery({
    ...queryKeys.datasetPermissionGroupsList(dataset_id),
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetUpdatePermissionGroups = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((groups: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    groups.forEach(({ id, assigned }) => {
      keyedChanges[id] = { id, assigned };
    });
    queryClient.setQueryData(
      queryKeys.datasetPermissionUsersList(dataset_id).queryKey,
      (oldData) => {
        return (
          oldData?.map((group) => {
            const updatedGroup = keyedChanges[group.id];
            if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
            return group;
          }) || []
        );
      }
    );

    return updateDatasetPermissionGroups({ dataset_id, groups });
  });

  return useMutation({
    mutationFn
  });
};

export const useDatasetListDatasetGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetDatasetGroups({ dataset_id }));

  return useQuery({
    ...queryKeys.datasetGroupsList,
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetListPermissionUsers = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetPermissionUsers({ dataset_id }));

  return useQuery({
    ...queryKeys.datasetPermissionUsersList(dataset_id),
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetUpdateDatasetGroups = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((groups: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    groups.forEach(({ id, assigned }) => {
      keyedChanges[id] = { id, assigned };
    });
    queryClient.setQueryData(
      queryKeys.datasetPermissionGroupsList(dataset_id).queryKey,
      (oldData) => {
        return (
          oldData?.map((group) => {
            const updatedGroup = keyedChanges[group.id];
            if (updatedGroup) return { ...group, assigned: updatedGroup.assigned };
            return group;
          }) || []
        );
      }
    );
    return updateDatasetDatasetGroups({ dataset_id, groups });
  });

  return useMutation({
    mutationFn
  });
};

export const useDatasetUpdatePermissionUsers = (dataset_id: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((users: { id: string; assigned: boolean }[]) => {
    const keyedChanges: Record<string, { id: string; assigned: boolean }> = {};
    users.forEach(({ id, assigned }) => {
      keyedChanges[id] = { id, assigned };
    });
    queryClient.setQueryData(
      queryKeys.datasetPermissionUsersList(dataset_id).queryKey,
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
  });

  return useMutation({
    mutationFn
  });
};
