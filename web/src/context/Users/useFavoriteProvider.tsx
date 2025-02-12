import { useBusterWebSocket } from '../BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import { BusterUserFavorite, ShareAssetType } from '@/api/asset_interfaces';
import { createQueryKey, useSocketQueryEmitOn, useSocketQueryMutation } from '@/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { useHotkeys } from 'react-hotkeys-hook';

export const useFavoriteProvider = () => {
  const busterSocket = useBusterWebSocket();
  const queryClient = useQueryClient();

  const favoritesQueryKey = createQueryKey(
    { route: '/users/favorites/list:listFavorites' },
    { route: '/users/favorites/list', payload: {} }
  );

  const { data: userFavorites, refetch: refreshFavoritesList } = useSocketQueryEmitOn(
    { route: '/users/favorites/list', payload: {} },
    { route: '/users/favorites/list:listFavorites' }
  );

  const { mutate: addItemToFavorite } = useSocketQueryMutation(
    { route: '/users/favorites/post' },
    {
      route: '/users/favorites/post:createFavorite'
    }
  );

  const setUserFavorites = useMemoizedFn(
    (updater: (v: BusterUserFavorite[]) => BusterUserFavorite[]) => {
      queryClient.setQueryData(favoritesQueryKey, (v: BusterUserFavorite[] | undefined) => {
        return updater(v || []);
      });
    }
  );

  const aXddItemToFavorite = useMemoizedFn(
    async ({
      id,
      asset_type,
      name
    }: {
      id: string;
      asset_type: ShareAssetType;
      name: string;
      index?: number;
    }) => {
      setUserFavorites((v) => [{ id, type: asset_type, name }, ...v]);

      // busterSocket.emit({
      //   route: '/users/favorites/post',
      //   payload: {
      //     id,
      //     asset_type
      //   }
      // });

      // await busterSocket.emitAndOnce({
      //   emitEvent: {
      //     route: '/users/favorites/post',
      //     payload: {
      //       id,
      //       asset_type
      //     }
      //   },
      //   responseEvent: {
      //     route: '/users/favorites/post:createFavorite',
      //     callback: _onSetInitialFavoritesList
      //   }
      // });
    }
  );

  const removeItemFromFavorite = useMemoizedFn(
    async ({ id, asset_type }: { id: string; asset_type: ShareAssetType }) => {
      // setUserFavorites(userFavorites.filter((f) => f.id !== id));
      // await busterSocket.emitAndOnce({
      //   emitEvent: {
      //     route: '/users/favorites/delete',
      //     payload: {
      //       id,
      //       asset_type
      //     }
      //   },
      //   responseEvent: {
      //     route: '/users/favorites/post:createFavorite',
      //     callback: _onSetInitialFavoritesList
      //   }
      // });
    }
  );

  const reorderFavorites = useMemoizedFn(async (favorites: string[]) => {
    // requestAnimationFrame(() => {
    //   setUserFavorites((v) => {
    //     return favorites.map((id, index) => {
    //       let favorite = v.find((f) => f.id === id || f.collection_id === id)!;
    //       return { ...favorite, index };
    //     });
    //   });
    // });
    // await busterSocket.emitAndOnce({
    //   emitEvent: {
    //     route: '/users/favorites/update',
    //     payload: {
    //       favorites
    //     }
    //   },
    //   responseEvent: {
    //     route: '/users/favorites/update:updateFavorite',
    //     callback: _onSetInitialFavoritesList
    //   }
    // });
  });

  const bulkEditFavorites = useMemoizedFn(async (favorites: string[]) => {
    return reorderFavorites(favorites);
  });

  return {
    bulkEditFavorites,
    refreshFavoritesList,
    reorderFavorites,
    userFavorites: userFavorites || [],
    addItemToFavorite,
    removeItemFromFavorite
  };
};
