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
  getUserPermissionGroups_server
} from './requests';
import { useMemoizedFn } from 'ahooks';
import { QueryClient } from '@tanstack/react-query';

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
