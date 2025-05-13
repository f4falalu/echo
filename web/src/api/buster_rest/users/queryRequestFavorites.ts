import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  createUserFavorite,
  deleteUserFavorite,
  getUserFavorites,
  getUserFavorites_server,
  updateUserFavorites
} from './requests';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useUserConfigContextSelector } from '@/context/Users';

export const useGetUserFavorites = () => {
  const queryFn = useMemoizedFn(async () => getUserFavorites());
  const organizationId = useUserConfigContextSelector((state) => state.userOrganizations?.id);
  return useQuery({
    ...queryKeys.favoritesGetList,
    queryFn,
    enabled: !!organizationId
  });
};

export const prefetchGetUserFavorites = async (queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();
  await queryClient.prefetchQuery({
    ...queryKeys.favoritesGetList,
    queryFn: () => getUserFavorites_server()
  });
  return queryClient;
};

export const useAddUserFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUserFavorite,
    onMutate: (params) => {
      queryClient.setQueryData(queryKeys.favoritesGetList.queryKey, (prev) => {
        const prevIds = prev?.map((p) => p.id) || [];
        const dedupedAdd = params.filter((p) => !prevIds.includes(p.id));
        return [...dedupedAdd, ...(prev || [])];
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.favoritesGetList.queryKey, data);
    }
  });
};

export const useDeleteUserFavorite = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserFavorite,
    onMutate: (id) => {
      queryClient.setQueryData(queryKeys.favoritesGetList.queryKey, (prev) => {
        return prev?.filter((fav) => !id.includes(fav.id));
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.favoritesGetList.queryKey, data);
    }
  });
};

export const useUpdateUserFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserFavorites,
    onMutate: (params) => {
      queryClient.setQueryData(queryKeys.favoritesGetList.queryKey, (prev) => {
        return prev?.filter((fav, index) => {
          const id = fav.id;
          const favorite = (prev || []).find((f) => f.id === id)!;
          return { ...favorite, index };
        });
      });
    }
  });
};
