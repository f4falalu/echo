import { useMemoizedFn } from 'ahooks';
import { useSocketQueryEmitOn, useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

export const useFavoriteProvider = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useSocketQueryEmitOn({
    emitEvent: { route: '/users/favorites/list', payload: {} },
    responseEvent: '/users/favorites/list:listFavorites',
    options: queryKeys['/favorites/list:getFavoritesList']
  });

  const { mutate: addItemToFavorite } = useSocketQueryMutation({
    emitEvent: '/users/favorites/post',
    responseEvent: '/users/favorites/post:createFavorite',
    options: queryKeys['/favorites/list:getFavoritesList'],
    preCallback: (prev, mutationParams) => [mutationParams, ...(prev || [])]
  });

  const { mutate: removeItemFromFavorite } = useSocketQueryMutation({
    emitEvent: '/users/favorites/delete',
    responseEvent: '/users/favorites/post:createFavorite',
    options: queryKeys['/favorites/list:getFavoritesList'],
    preCallback: (prev, mutationParams) => prev?.filter((f) => f.id !== mutationParams.id) || []
  });

  const { mutate: updateFavorites } = useSocketQueryMutation({
    emitEvent: '/users/favorites/update',
    responseEvent: '/users/favorites/update:updateFavorite',
    options: queryKeys['/favorites/list:getFavoritesList'],
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
    userFavorites: userFavorites || [],
    addItemToFavorite,
    removeItemFromFavorite
  };
};
