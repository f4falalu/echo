import { useCreateReactMutation, useCreateReactQuery } from '@/api/createReactQuery';
import {
  listDatasetGroups,
  deleteDatasetGroup,
  createDatasetGroup,
  getDatasetGroup,
  updateDatasetGroup,
  updateDatasetGroupUsers,
  updateDatasetGroupDatasets,
  updateDatasetGroupPermissionGroups,
  getDatasetGroupUsers,
  getDatasetGroupDatasets,
  getDatasetGroupPermissionGroups,
  getDatasetGroup_server,
  getDatasetGroupUsers_server,
  getDatasetGroupDatasets_server,
  getDatasetGroupPermissionGroups_server
} from './requests';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemoizedFn } from 'ahooks';
import type {
  GetDatasetGroupDatasetsResponse,
  GetDatasetGroupPermissionGroupsResponse,
  GetDatasetGroupUsersResponse
} from '../../asset_interfaces';
import { timeout } from '@/utils';
import { queryKeys } from '@/api/query_keys';

export const useListDatasetGroups = () => {
  const queryFn = useMemoizedFn(() => listDatasetGroups());
  return useCreateReactQuery({
    ...queryKeys.datasetGroupsList,
    queryFn
  });
};

export const useDeleteDatasetGroup = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (id: string) => {
    const res = await deleteDatasetGroup(id);
    queryClient.invalidateQueries({
      queryKey: queryKeys.datasetGroupsList.queryKey,
      exact: true
    });

    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroup = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (data: Parameters<typeof updateDatasetGroup>[0]) => {
    const res = await updateDatasetGroup(data);
    queryClient.invalidateQueries({
      queryKey: queryKeys.datasetGroupsList.queryKey,
      exact: true
    });
    return res;
  });

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetDatasetGroup = (datasetId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroup(datasetId));
  return useCreateReactQuery({
    ...queryKeys.datasetGroupsGet(datasetId),
    queryFn
  });
};

export const prefetchDatasetGroup = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGet(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroup_server(datasetGroupId)
  });
  return queryClient;
};

export const useCreateDatasetGroup = (datasetId?: string, userId?: string) => {
  const { mutateAsync: updateDatasetGroupDatasets } = useUpdateDatasetGroupDatasets();
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(
    async ({
      datasetsToAdd,
      ...data
    }: Parameters<typeof createDatasetGroup>[0] & { datasetsToAdd?: string[] }) => {
      const newDatasetGroup = await createDatasetGroup(data);
      if (newDatasetGroup?.id && datasetsToAdd?.length) {
        await timeout(200);
        await updateDatasetGroupDatasets({
          datasetGroupId: newDatasetGroup.id,
          groups: datasetsToAdd.map((datasetId) => ({ id: datasetId, assigned: true }))
        });
      }

      if (datasetId) {
        await queryClient.invalidateQueries({
          ...queryKeys.datasetPermissionGroupsList(datasetId),
          exact: true
        });
      }
      await queryClient.invalidateQueries({
        queryKey: queryKeys.datasetGroupsList.queryKey,
        exact: true
      });

      if (userId) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.userGetUserDatasetGroups(userId).queryKey,
          exact: true
        });
      }
      return newDatasetGroup;
    }
  );

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetDatasetGroupUsers = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupUsers(datasetGroupId));
  return useCreateReactQuery({
    ...queryKeys.datasetGroupsGetUsers(datasetGroupId),
    queryFn
  });
};

export const prefetchDatasetGroupUsers = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGetUsers(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroupUsers_server(datasetGroupId)
  });
  return queryClient;
};

export const useGetDatasetGroupDatasets = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupDatasets(datasetGroupId));
  return useCreateReactQuery({
    ...queryKeys.datasetGroupsGetDatasets(datasetGroupId),
    queryFn
  });
};

export const prefetchDatasetGroupDatasets = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGetDatasets(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroupDatasets_server(datasetGroupId)
  });
  return queryClient;
};

export const useGetDatasetGroupPermissionGroups = (datasetGroupId: string) => {
  const queryFn = useMemoizedFn(() => getDatasetGroupPermissionGroups(datasetGroupId));
  return useCreateReactQuery({
    ...queryKeys.datasetGroupsGetPermissionGroups(datasetGroupId),
    queryFn
  });
};

export const prefetchDatasetGroupPermissionGroups = async (
  datasetGroupId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  const { queryKey } = queryKeys.datasetGroupsGetPermissionGroups(datasetGroupId);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: () => getDatasetGroupPermissionGroups_server(datasetGroupId)
  });
  return queryClient;
};

export const useUpdateDatasetGroupUsers = (datasetGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      queryKeys.datasetGroupsGetUsers(datasetGroupId).queryKey,
      (oldData: GetDatasetGroupUsersResponse[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((user) => {
          const userToUpdate = data.find((d) => d.id === user.id);
          if (userToUpdate) {
            return { ...user, assigned: userToUpdate.assigned };
          }
          return user;
        });
      }
    );
    return updateDatasetGroupUsers(datasetGroupId, data);
  });
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroupDatasets = () => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    ({
      datasetGroupId,
      groups
    }: {
      datasetGroupId: string;
      groups: { id: string; assigned: boolean }[];
    }) => {
      queryClient.setQueryData(
        queryKeys.datasetGroupsGetDatasets(datasetGroupId).queryKey,
        (oldData: GetDatasetGroupDatasetsResponse[] | undefined) => {
          if (!oldData) return [];
          return oldData.map((dataset) => {
            const datasetToUpdate = groups.find((d) => d.id === dataset.id);
            if (datasetToUpdate) {
              return { ...dataset, assigned: datasetToUpdate.assigned };
            }
            return dataset;
          });
        }
      );
      return updateDatasetGroupDatasets(datasetGroupId, groups);
    }
  );
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateDatasetGroupPermissionGroups = (datasetGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      queryKeys.datasetGroupsGetPermissionGroups(datasetGroupId).queryKey,
      (oldData: GetDatasetGroupPermissionGroupsResponse[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((permissionGroup) => {
          const permissionGroupToUpdate = data.find((d) => d.id === permissionGroup.id);
          if (permissionGroupToUpdate) {
            return { ...permissionGroup, assigned: permissionGroupToUpdate.assigned };
          }
          return permissionGroup;
        });
      }
    );
    return updateDatasetGroupPermissionGroups(datasetGroupId, data);
  });
  return useCreateReactMutation({
    mutationFn
  });
};
