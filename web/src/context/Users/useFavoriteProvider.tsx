import { useMemoizedFn } from '@/hooks';
import { useSocketQueryEmitOn, useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';
import type { BusterUserFavorite } from '@/api/asset_interfaces/users';
import isEmpty from 'lodash/isEmpty';

const DEFAULT_FAVORITES: BusterUserFavorite[] = [];

export const useFavoriteProvider = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useSocketQueryEmitOn({
    emitEvent: { route: '/users/favorites/list', payload: {} },
    responseEvent: '/users/favorites/list:listFavorites',
    options: queryKeys.favoritesGetList
  });

  const { mutate: addItemToFavorite } = useSocketQueryMutation({
    emitEvent: '/users/favorites/post',
    responseEvent: '/users/favorites/post:createFavorite',
    options: queryKeys.favoritesGetList,
    preCallback: (prev, mutationParams) => [mutationParams, ...(prev || [])]
  });

  const { mutate: removeItemFromFavorite } = useSocketQueryMutation({
    emitEvent: '/users/favorites/delete',
    responseEvent: '/users/favorites/post:createFavorite',
    options: queryKeys.favoritesGetList,
    preCallback: (prev, mutationParams) => prev?.filter((f) => f.id !== mutationParams.id) || []
  });

  const { mutate: updateFavorites } = useSocketQueryMutation({
    emitEvent: '/users/favorites/update',
    responseEvent: '/users/favorites/update:updateFavorite',
    options: queryKeys.favoritesGetList,
    preCallback: (prev, mutationParams) => {
      return mutationParams.favorites.map((id, index) => {
        const favorite = (prev || []).find((f) => f.id === id || f.collection_id === id)!;
        return { ...favorite, index };
      });
    }
  });

  const bulkEditFavorites = useMemoizedFn(async (favorites: string[]) => {
    return updateFavorites({ favorites });
  });

  return {
    bulkEditFavorites,
    refreshFavoritesList,
    userFavorites: isEmpty(userFavorites) ? DEFAULT_FAVORITES : userFavorites!,
    addItemToFavorite,
    removeItemFromFavorite
  };
};
