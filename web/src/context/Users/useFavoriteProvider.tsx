import { useMemoizedFn } from 'ahooks';
import { useSocketQueryEmitOn, useSocketQueryMutation } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/asset_interfaces';

export const useFavoriteProvider = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useSocketQueryEmitOn(
    { route: '/users/favorites/list', payload: {} },
    '/users/favorites/list:listFavorites',
    queryKeys['/favorites/list:getFavoritesList']
  );

  const { mutate: addItemToFavorite } = useSocketQueryMutation(
    { route: '/users/favorites/post' },
    { route: '/users/favorites/post:createFavorite' },
    queryKeys['/favorites/list:getFavoritesList'],
    (prev, mutationParams) => [mutationParams, ...(prev || [])]
  );

  const { mutate: removeItemFromFavorite } = useSocketQueryMutation(
    { route: '/users/favorites/delete' },
    { route: '/users/favorites/post:createFavorite' },
    queryKeys['/favorites/list:getFavoritesList'],
    (prev, mutationParams) => prev?.filter((f) => f.id !== mutationParams.id) || []
  );

  const { mutate: updateFavorites } = useSocketQueryMutation(
    { route: '/users/favorites/update' },
    { route: '/users/favorites/update:updateFavorite' },
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
