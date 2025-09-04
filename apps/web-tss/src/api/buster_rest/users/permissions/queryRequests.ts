import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userQueryKeys } from '@/api/query_keys/users';
import {
  getUserAttributes,
  getUserDatasetGroups,
  getUserDatasets,
  getUserPermissionGroups,
  getUserTeams,
  updateUserDatasetGroups,
  updateUserDatasets,
  updateUserPermissionGroups,
  updateUserTeams,
} from './requests';

export const useGetUserDatasetGroups = ({ userId }: { userId: string }) => {
  const queryFn = async () => getUserDatasetGroups({ userId });
  return useQuery({
    ...userQueryKeys.userGetUserDatasetGroups(userId),
    queryFn,
  });
};

export const prefetchGetUserDatasetGroups = async (userId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserDatasetGroups(userId),
    queryFn: () => getUserDatasetGroups({ userId }),
  });
  return queryClient;
};

export const useGetUserDatasets = ({ userId }: { userId: string }) => {
  const queryFn = async () => getUserDatasets({ userId });
  return useQuery({
    ...userQueryKeys.userGetUserDatasets(userId),
    queryFn,
  });
};

export const prefetchGetUserDatasets = async (userId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserDatasets(userId),
    queryFn: () => getUserDatasets({ userId }),
  });
  return queryClient;
};

export const useGetUserAttributes = ({ userId }: { userId: string }) => {
  const queryFn = async () => getUserAttributes({ userId });
  return useQuery({
    ...userQueryKeys.userGetUserAttributes(userId),
    queryFn,
  });
};

export const prefetchGetUserAttributes = async (userId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserAttributes(userId),
    queryFn: () => getUserAttributes({ userId }),
  });
  return queryClient;
};

export const useGetUserTeams = ({ userId }: { userId: string }) => {
  const queryFn = async () => getUserTeams({ userId });
  return useQuery({
    ...userQueryKeys.userGetUserTeams(userId),
    queryFn,
    enabled: !!userId,
    notifyOnChangeProps: ['data'],
  });
};

export const prefetchGetUserTeams = async (userId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserTeams(userId),
    queryFn: () => getUserTeams({ userId }),
  });
  return queryClient;
};

export const useGetUserPermissionGroups = ({ userId }: { userId: string }) => {
  const queryFn = async () => getUserPermissionGroups({ userId });
  return useQuery({
    ...userQueryKeys.userGetUserPermissionsGroups(userId),
    queryFn,
  });
};

export const prefetchGetUserPermissionGroups = async (userId: string, queryClient: QueryClient) => {
  await queryClient.prefetchQuery({
    ...userQueryKeys.userGetUserPermissionsGroups(userId),
    queryFn: () => getUserPermissionGroups({ userId }),
  });
  return queryClient;
};

export const useUpdateUserTeams = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = async (teams: Parameters<typeof updateUserTeams>[1]) => {
    const options = userQueryKeys.userGetUserTeams(userId);
    const queryKey = options.queryKey;
    queryClient.setQueryData(queryKey, (oldData) => {
      return (oldData || []).map((oldTeam) => {
        const updatedTeam = teams.find((t) => t.id === oldTeam.id);
        if (updatedTeam) return { ...oldTeam, role: updatedTeam.role };
        return oldTeam;
      });
    });
    const result = await updateUserTeams(userId, teams);

    return result;
  };
  return useMutation({
    mutationFn,
  });
};

export const useUpdateUserPermissionGroups = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = async (permissionGroups: Parameters<typeof updateUserPermissionGroups>[1]) => {
    const options = userQueryKeys.userGetUserPermissionsGroups(userId);
    const queryKey = options.queryKey;
    queryClient.setQueryData(queryKey, (oldData) => {
      return (oldData || []).map((oldGroup) => {
        const updatedGroup = permissionGroups.find((pg) => pg.id === oldGroup.id);
        if (updatedGroup) return { ...oldGroup, assigned: updatedGroup.assigned };
        return oldGroup;
      });
    });
    const result = await updateUserPermissionGroups(userId, permissionGroups);
    return result;
  };
  return useMutation({
    mutationFn,
  });
};

export const useUpdateUserDatasetGroups = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = async (datasetGroups: Parameters<typeof updateUserDatasetGroups>[1]) => {
    const options = userQueryKeys.userGetUserDatasetGroups(userId);
    const queryKey = options.queryKey;
    queryClient.setQueryData(queryKey, (oldData) => {
      return (oldData || []).map((oldGroup) => {
        const updatedGroup = datasetGroups.find((pg) => pg.id === oldGroup.id);
        if (updatedGroup) return { ...oldGroup, assigned: updatedGroup.assigned };
        return oldGroup;
      });
    });
    const result = await updateUserDatasetGroups(userId, datasetGroups);
    return result;
  };
  return useMutation({
    mutationFn,
  });
};

export const useUpdateUserDatasets = ({ userId }: { userId: string }) => {
  const queryClient = useQueryClient();
  const mutationFn = async (datasets: Parameters<typeof updateUserDatasets>[1]) => {
    const options = userQueryKeys.userGetUserDatasets(userId);
    const queryKey = options.queryKey;
    queryClient.setQueryData(queryKey, (oldData) => {
      return (oldData || []).map((oldDataset) => {
        const updatedDataset = datasets.find((d) => d.id === oldDataset.id);
        if (updatedDataset) return { ...oldDataset, assigned: updatedDataset.assigned };
        return oldDataset;
      });
    });
    const result = await updateUserDatasets(userId, datasets);
    return result;
  };
  return useMutation({ mutationFn });
};
