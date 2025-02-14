import { useMemoizedFn } from 'ahooks';
import { useSocketQueryEmitOn, useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

export const useFavoriteProvider = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useSocketQueryEmitOn(
    { route: '/users/favorites/list', payload: {} },
    '/users/favorites/list:listFavorites',
    queryKeys['/favorites/list:getFavoritesList']
  );

  const { mutate: addItemToFavorite } = useSocketQueryMutation(
    '/users/favorites/post',
    '/users/favorites/post:createFavorite',
    queryKeys['/favorites/list:getFavoritesList'],
    (prev, mutationParams) => [mutationParams, ...(prev || [])]
  );

  const { mutate: removeItemFromFavorite } = useSocketQueryMutation(
    '/users/favorites/delete',
    '/users/favorites/post:createFavorite',
    queryKeys['/favorites/list:getFavoritesList'],
    (prev, mutationParams) => prev?.filter((f) => f.id !== mutationParams.id) || []
  );

  const { mutate: updateFavorites } = useSocketQueryMutation(
    '/users/favorites/update',
    '/users/favorites/update:updateFavorite',
    queryKeys['/favorites/list:getFavoritesList'],
    (prev, mutationParams) => {
      return mutationParams.favorites.map((id, index) => {
        const favorite = (prev || []).find((f) => f.id === id || f.collection_id === id)!;
        return { ...favorite, index };
      });
    }
  );

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
