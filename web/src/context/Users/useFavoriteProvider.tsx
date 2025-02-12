import { useMemoizedFn } from 'ahooks';
import { useSocketQueryEmitOn, useSocketQueryMutation } from '@/hooks';

export const useFavoriteProvider = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useSocketQueryEmitOn(
    { route: '/users/favorites/list', payload: {} },
    { route: '/users/favorites/list:listFavorites' }
  );

  const { mutate: addItemToFavorite } = useSocketQueryMutation(
    { route: '/users/favorites/post' },
    { route: '/users/favorites/post:createFavorite' },
    { preSetQueryData: (prev, mutationParams) => [mutationParams, ...(prev || [])] }
  );

  const { mutate: removeItemFromFavorite } = useSocketQueryMutation(
    { route: '/users/favorites/delete' },
    { route: '/users/favorites/post:createFavorite' },
    {
      preSetQueryData: (prev, mutationParams) =>
        prev?.filter((f) => f.id !== mutationParams.id) || []
    }
  );

  const { mutate: updateFavorites } = useSocketQueryMutation(
    { route: '/users/favorites/update' },
    { route: '/users/favorites/update:updateFavorite' },
    {
      awaitPrefetchQueryData: true,
      preSetQueryData: (prev, mutationParams) => {
        return mutationParams.favorites.map((id, index) => {
          let favorite = (prev || []).find((f) => f.id === id || f.collection_id === id)!;
          return { ...favorite, index };
        });
      }
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
