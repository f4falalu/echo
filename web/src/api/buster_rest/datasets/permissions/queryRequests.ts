import {
  useCreateReactQuery,
  useCreateReactMutation,
  PREFETCH_STALE_TIME
} from '@/api/createReactQuery';
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

  return useCreateReactQuery({
    ...queryKeys.datasetPermissionsOverview(dataset_id),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
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

  return useCreateReactQuery({
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

  return useCreateReactMutation({
    mutationFn
  });
};

export const useDatasetListDatasetGroups = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetDatasetGroups({ dataset_id }));

  return useCreateReactQuery({
    ...queryKeys.datasetGroupsList,
    queryFn,
    enabled: !!dataset_id
  });
};

export const useDatasetListPermissionUsers = (dataset_id: string) => {
  const queryFn = useMemoizedFn(() => listDatasetPermissionUsers({ dataset_id }));

  return useCreateReactQuery({
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

  return useCreateReactMutation({
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

  return useCreateReactMutation({
    mutationFn
  });
};
