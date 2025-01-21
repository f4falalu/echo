import {
  useCreateReactMutation,
  PREFETCH_STALE_TIME,
  useCreateReactQuery
} from '@/api/createReactQuery';
import * as config from './config';
import {
  getUserDatasetGroups,
  getUserAttributes,
  getUserDatasets,
  getUserPermissionGroups,
  getUserTeams,
  getUserDatasetGroups_server,
  getUserTeams_server,
  getUserDatasets_server,
  getUserAttributes_server,
  getUserPermissionGroups_server,
  updateUserDatasetGroups,
  updateUserPermissionGroups,
  updateUserTeams
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { BusterUserPermissionGroup } from './interfaces';

export const useGetUserDatasetGroups = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserDatasetGroups({ userId }));
  return useCreateReactQuery({
    queryKey: config.USER_PERMISSIONS_DATASET_GROUPS_QUERY_KEY(userId),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchGetUserDatasetGroups = async (
  userId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: config.USER_PERMISSIONS_DATASET_GROUPS_QUERY_KEY(userId),
    queryFn: () => getUserDatasetGroups_server({ userId })
  });
  return queryClient;
};

export const useGetUserDatasets = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserDatasets({ userId }));
  return useCreateReactQuery({
    queryKey: config.USER_PERMISSIONS_DATASETS_QUERY_KEY(userId),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchGetUserDatasets = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: config.USER_PERMISSIONS_DATASETS_QUERY_KEY(userId),
    queryFn: () => getUserDatasets_server({ userId })
  });
  return queryClient;
};

export const useGetUserAttributes = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserAttributes({ userId }));
  return useCreateReactQuery({
    queryKey: config.USER_PERMISSIONS_ATTRIBUTES_QUERY_KEY(userId),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchGetUserAttributes = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: config.USER_PERMISSIONS_ATTRIBUTES_QUERY_KEY(userId),
    queryFn: () => getUserAttributes_server({ userId })
  });
  return queryClient;
};

export const useGetUserTeams = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserTeams({ userId }));
  return useCreateReactQuery({
    queryKey: config.USER_PERMISSIONS_TEAMS_QUERY_KEY(userId),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchGetUserTeams = async (userId: string, queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: config.USER_PERMISSIONS_TEAMS_QUERY_KEY(userId),
    queryFn: () => getUserTeams_server({ userId })
  });
  return queryClient;
};

export const useGetUserPermissionGroups = ({ userId }: { userId: string }) => {
  const queryFn = useMemoizedFn(async () => getUserPermissionGroups({ userId }));
  return useCreateReactQuery({
    queryKey: config.USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY(userId),
    queryFn,
    staleTime: PREFETCH_STALE_TIME
  });
};

export const prefetchGetUserPermissionGroups = async (
  userId: string,
  queryClientProp?: QueryClient
) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: config.USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY(userId),
    queryFn: () => getUserPermissionGroups_server({ userId })
  });
  return queryClient;
};

export const useUpdateUserTeams = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(async (teams: Parameters<typeof updateUserTeams>[1]) => {
    //    queryClient.setQueryData(config.USER_PERMISSIONS_TEAMS_QUERY_KEY(userId), teams);

    const result = await updateUserTeams(userId, teams);

    return result;
  });
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateUserPermissionGroups = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = useMemoizedFn(
    async (permissionGroups: Parameters<typeof updateUserPermissionGroups>[1]) => {
      queryClient.setQueryData(
        config.USER_PERMISSIONS_PERMISSION_GROUPS_QUERY_KEY(userId),
        (oldData: BusterUserPermissionGroup[]) => {
          return oldData.map((oldGroup) => {
            const updatedGroup = permissionGroups.find((pg) => pg.id === oldGroup.id);
            if (updatedGroup) return { ...oldGroup, assigned: updatedGroup.assigned };
            return oldGroup;
          });
        }
      );
      const result = await updateUserPermissionGroups(userId, permissionGroups);
      return result;
    }
  );
  return useCreateReactMutation({
    mutationFn
  });
};

export const useUpdateUserDatasetGroups = ({ userId }: { userId: string }) => {
  const mutationFn = useMemoizedFn(
    async (datasetGroups: Parameters<typeof updateUserDatasetGroups>[1]) => {
      const result = await updateUserDatasetGroups(userId, datasetGroups);
      return result;
    }
  );
  return useCreateReactMutation({
    mutationFn
  });
};
