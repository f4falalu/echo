import { useCreateReactQuery, useCreateReactMutation } from '@/api/createReactQuery';
import {
  getPermissionGroup,
  createPermissionGroup,
  deletePermissionGroup,
  listAllPermissionGroups,
  updatePermissionGroups,
  getPermissionGroupUsers,
  getPermissionGroupDatasets,
  getPermissionGroupDatasetGroups,
  updatePermissionGroupUsers,
  updatePermissionGroupDatasets,
  updatePermissionGroupDatasetGroups
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { useQueryClient } from '@tanstack/react-query';
import {
  GetPermissionGroupDatasetGroupsResponse,
  GetPermissionGroupDatasetsResponse,
  GetPermissionGroupResponse,
  GetPermissionGroupUsersResponse
} from './responseInterfaces';
import isEmpty from 'lodash/isEmpty';
import { PERMISSION_GROUP_QUERY_KEY } from './config';
import { ListPermissionGroupsResponse, updateDatasetPermissionGroups } from '../datasets';
import { USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY } from '../users/permissions/config';

export const useListAllPermissionGroups = () => {
  return useCreateReactQuery({
    queryKey: ['permission_groups'],
    queryFn: listAllPermissionGroups
  });
};

export const useCreatePermissionGroup = (userId?: string) => {
  const queryClient = useQueryClient();

  const mutationFn = useMemoizedFn(
    async ({
      name,
      dataset_id
    }: Parameters<typeof createPermissionGroup>[0] & { dataset_id?: string }) => {
      const res = await createPermissionGroup({ name });

      if (dataset_id && res?.id) {
        await updateDatasetPermissionGroups({
          dataset_id,
          groups: [{ id: res.id, assigned: true }]
        });
      }

      queryClient.setQueryData(
        [PERMISSION_GROUP_QUERY_KEY],
        (oldData: GetPermissionGroupResponse[]) => (isEmpty(oldData) ? [res] : [...oldData, res])
      );

      if (dataset_id) {
        queryClient.setQueryData(
          [PERMISSION_GROUP_QUERY_KEY, dataset_id],
          (oldData: ListPermissionGroupsResponse[]) => {
            const newItem: ListPermissionGroupsResponse = {
              id: res.id,
              name: res.name,
              assigned: !!dataset_id
            };
            if (isEmpty(oldData)) {
              return [newItem];
            }
            return [...oldData, newItem];
          }
        );
      }

      if (userId) {
        queryClient.invalidateQueries({
          queryKey: USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY(userId)
        });
      }

      return res;
    }
  );

  return useCreateReactMutation({
    mutationFn
  });
};

export const useGetPermissionGroup = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroup({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId],
    queryFn
  });
};

export const useDeletePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useCreateReactMutation({
    mutationFn: deletePermissionGroup,
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['permission_groups'] });
      //TODO delete the permission group from the dataset
    }
  });
};

export const useUpdatePermissionGroup = () => {
  const queryClient = useQueryClient();
  return useCreateReactMutation({
    mutationFn: updatePermissionGroups,
    onSuccess: (data, varaiables, context) => {
      // TODO update the permission group in the dataset
    }
  });
};

export const useGetPermissionGroupUsers = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupUsers({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId, 'users'],
    queryFn
  });
};

export const useGetPermissionGroupDatasets = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupDatasets({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId, 'datasets'],
    queryFn
  });
};

export const useGetPermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryFn = useMemoizedFn(() => getPermissionGroupDatasetGroups({ id: permissionGroupId }));
  return useCreateReactQuery({
    queryKey: ['permission_group', permissionGroupId, 'dataset_groups'],
    queryFn
  });
};

export const useUpdatePermissionGroupUsers = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['permission_group', permissionGroupId, 'users'],
      (oldData: GetPermissionGroupUsersResponse[]) => {
        return oldData.map((user) => {
          const userToUpdate = data.find((d) => d.id === user.id);
          if (userToUpdate) {
            return { ...user, assigned: userToUpdate.assigned };
          }
          return user;
        });
      }
    );

    return updatePermissionGroupUsers({ id: permissionGroupId, data });
  });
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdatePermissionGroupDatasets = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['permission_group', permissionGroupId, 'datasets'],
      (oldData: GetPermissionGroupDatasetsResponse[]) => {
        return oldData.map((dataset) => {
          const datasetToUpdate = data.find((d) => d.id === dataset.id);
          if (datasetToUpdate) {
            return { ...dataset, assigned: datasetToUpdate.assigned };
          }
          return dataset;
        });
      }
    );

    return updatePermissionGroupDatasets({ id: permissionGroupId, data });
  });
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdatePermissionGroupDatasetGroups = (permissionGroupId: string) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn((data: { id: string; assigned: boolean }[]) => {
    queryClient.setQueryData(
      ['permission_group', permissionGroupId, 'dataset_groups'],
      (oldData: GetPermissionGroupDatasetGroupsResponse[]) => {
        return oldData.map((datasetGroup) => {
          const datasetGroupToUpdate = data.find((d) => d.id === datasetGroup.id);
          if (datasetGroupToUpdate) {
            return { ...datasetGroup, assigned: datasetGroupToUpdate.assigned };
          }
          return datasetGroup;
        });
      }
    );
    return updatePermissionGroupDatasetGroups({ id: permissionGroupId, data });
  });
  return useCreateReactMutation({
    mutationFn
  });
};
