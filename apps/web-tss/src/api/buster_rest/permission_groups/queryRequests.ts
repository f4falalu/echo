import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GetPermissionGroupResponse } from '@/api/asset_interfaces/permission_groups';
import { permissionGroupQueryKeys } from '@/api/query_keys/permission_groups';
import { userQueryKeys } from '@/api/query_keys/users';
import type { ListPermissionGroupsResponse } from '../../asset_interfaces';
import { updateDatasetPermissionGroups } from '../datasets';
import {
  createPermissionGroup,
  deletePermissionGroup,
  getPermissionGroup,
  getPermissionGroupDatasetGroups,
  getPermissionGroupDatasets,
  getPermissionGroupUsers,
  listAllPermissionGroups,
  updatePermissionGroupDatasetGroups,
  updatePermissionGroupDatasets,
  updatePermissionGroups,
  updatePermissionGroupUsers,
} from './requests';

export const useListAllPermissionGroups = () => {
  return useQuery({
    ...permissionGroupQueryKeys.permissionGroupList,
    queryFn: listAllPermissionGroups,
  });
};

export const prefetchAllPermissionGroups = async (queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...permissionGroupQueryKeys.permissionGroupList,
    queryFn: listAllPermissionGroups,
  });
  return queryClient.getQueryData(permissionGroupQueryKeys.permissionGroupList.queryKey);
};

export const useCreatePermissionGroup = (userId?: string) => {
  const queryClient = useQueryClient();
  const { mutateAsync: updatePermissionGroups } = useUpdatePermissionGroupDatasets();

  const mutationFn = async ({
    name,
    dataset_id,
    datasetsIdsToAssign,
  }: Parameters<typeof createPermissionGroup>[0] & {
    dataset_id?: string;
    datasetsIdsToAssign?: string[];
  }) => {
    const newPermissionGroup = await createPermissionGroup({ name });

    if (datasetsIdsToAssign && datasetsIdsToAssign.length > 0) {
      await updatePermissionGroups({
        permissionGroupId: newPermissionGroup.id,
        data: datasetsIdsToAssign.map((id) => ({ id, assigned: true })),
      });
    }

    queryClient.setQueryData(permissionGroupQueryKeys.permissionGroupList.queryKey, (oldData) => {
      const newListItem: ListPermissionGroupsResponse = {
        id: newPermissionGroup.id,
        name: newPermissionGroup.name,
        assigned: false,
      };
      if (!oldData) {
        return [newListItem];
      }
      return [...oldData, newListItem];
    });

    if (dataset_id && newPermissionGroup?.id) {
      const options = permissionGroupQueryKeys.permissionGroupListByDatasetId(dataset_id);
      queryClient.setQueryData(options.queryKey, (oldData) => {
        const newItem: GetPermissionGroupResponse = { ...newPermissionGroup };
        if (!oldData) {
          return [newItem];
        }
        return [...oldData, newItem];
      });
      await updateDatasetPermissionGroups({
        dataset_id,
        groups: [{ id: newPermissionGroup.id, assigned: true }],
      });
    }

    if (userId) {
      await queryClient.invalidateQueries({
        queryKey: userQueryKeys.userGetUserPermissionsGroups(userId).queryKey,
        exact: true,
      });
    }

    return newPermissionGroup;
  };

  return useMutation({
    mutationFn,
  });
};

export const useGetPermissionGroup = (permissionGroupId: string) => {
  const queryFn = () => getPermissionGroup({ id: permissionGroupId });
  return useQuery({
    ...permissionGroupQueryKeys.permissionGroup(permissionGroupId),
    queryFn,
  });
};

export const prefetchPermissionGroup = async (
  permissionGroupId: string,
  queryClient: QueryClient
) => {
  await queryClient.prefetchQuery({
    ...permissionGroupQueryKeys.permissionGroup(permissionGroupId),
    queryFn: () => getPermissionGroup({ id: permissionGroupId }),
  });
  return queryClient;
};

export const useDeletePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePermissionGroup,
    onSuccess: () => {
      const options = permissionGroupQueryKeys.permissionGroupList;
      const queryKey = options.queryKey;
      queryClient.invalidateQueries({ queryKey, exact: true });
      //TODO delete the permission group from the dataset
    },
  });
};

export const useUpdatePermissionGroup = () => {
  const queryClient = useQueryClient();

  const mutationFn = async (params: Parameters<typeof updatePermissionGroups>[0]) => {
    const res = await updatePermissionGroups(params);
    const options = permissionGroupQueryKeys.permissionGroupList;
    const queryKey = options.queryKey;
    queryClient.invalidateQueries({ queryKey, exact: true });
    return res;
  };

  return useMutation({
    mutationFn,
  });
};

export const useGetPermissionGroupUsers = (permissionGroupId: string) => {
  const queryFn = () => getPermissionGroupUsers({ id: permissionGroupId });
  return useQuery({
    ...permissionGroupQueryKeys.permissionGroupUsers(permissionGroupId),
    queryFn,
  });
};

export const prefetchPermissionGroupUsers = async (
  permissionGroupId: string,
  queryClient: QueryClient
) => {
  await queryClient.prefetchQuery({
    ...permissionGroupQueryKeys.permissionGroupUsers(permissionGroupId),
    queryFn: () => getPermissionGroupUsers({ id: permissionGroupId }),
  });
  return queryClient;
};

export const useGetPermissionGroupDatasets = (permissionGroupId: string) => {
  const queryFn = () => getPermissionGroupDatasets({ id: permissionGroupId });
  return useQuery({
    ...permissionGroupQueryKeys.permissionGroupDatasets(permissionGroupId),
    queryFn,
  });
};

export const prefetchPermissionGroupDatasets = async (
  permissionGroupId: string,
  queryClient: QueryClient
) => {
  await queryClient.prefetchQuery({
    ...permissionGroupQueryKeys.permissionGroupDatasets(permissionGroupId),
    queryFn: () => getPermissionGroupDatasets({ id: permissionGroupId }),
  });
  return queryClient;
};

export const useGetPermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryFn = () => getPermissionGroupDatasetGroups({ id: permissionGroupId });
  return useQuery({
    ...permissionGroupQueryKeys.permissionGroupDatasetGroups(permissionGroupId),
    queryFn,
  });
};

export const prefetchPermissionGroupDatasetGroups = async (
  permissionGroupId: string,
  queryClient: QueryClient
) => {
  await queryClient.prefetchQuery({
    ...permissionGroupQueryKeys.permissionGroupDatasetGroups(permissionGroupId),
    queryFn: () => getPermissionGroupDatasetGroups({ id: permissionGroupId }),
  });
  return queryClient;
};

export const useUpdatePermissionGroupUsers = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = (data: { id: string; assigned: boolean }[]) => {
    const options = permissionGroupQueryKeys.permissionGroupUsers(permissionGroupId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      return (oldData || []).map((user) => {
        const userToUpdate = data.find((d) => d.id === user.id);
        if (userToUpdate) {
          return { ...user, assigned: userToUpdate.assigned };
        }
        return user;
      });
    });

    return updatePermissionGroupUsers({ id: permissionGroupId, data });
  };
  return useMutation({
    mutationFn,
  });
};

export const useUpdatePermissionGroupDatasets = () => {
  const queryClient = useQueryClient();
  const mutationFn = ({
    permissionGroupId,
    data,
  }: {
    permissionGroupId: string;
    data: { id: string; assigned: boolean }[];
  }) => {
    const options = permissionGroupQueryKeys.permissionGroupDatasets(permissionGroupId);

    queryClient.setQueryData(options.queryKey, (oldData) => {
      return (oldData || []).map((dataset) => {
        const datasetToUpdate = data.find((d) => d.id === dataset.id);
        if (datasetToUpdate) {
          return { ...dataset, assigned: datasetToUpdate.assigned };
        }
        return dataset;
      });
    });

    return updatePermissionGroupDatasets({ id: permissionGroupId, data });
  };
  return useMutation({
    mutationFn,
  });
};

export const useUpdatePermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = (data: { id: string; assigned: boolean }[]) => {
    const options = permissionGroupQueryKeys.permissionGroupDatasetGroups(permissionGroupId);
    queryClient.setQueryData(options.queryKey, (oldData) => {
      return (oldData || []).map((datasetGroup) => {
        const datasetGroupToUpdate = data.find((d) => d.id === datasetGroup.id);
        if (datasetGroupToUpdate) {
          return { ...datasetGroup, assigned: datasetGroupToUpdate.assigned };
        }
        return datasetGroup;
      });
    });
    return updatePermissionGroupDatasetGroups({ id: permissionGroupId, data });
  };
  return useMutation({
    mutationFn,
  });
};
