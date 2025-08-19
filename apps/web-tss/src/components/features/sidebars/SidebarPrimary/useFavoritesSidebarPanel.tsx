import { type LinkProps, useMatchRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites,
} from '@/api/buster_rest/users';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import type { ISidebarGroup, ISidebarItem } from '@/components/ui/sidebar';
import { useMount } from '@/hooks/useMount';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import { getFavoriteRoute } from './getFavoriteRoute';

export const useFavoriteSidebarPanel = (): ISidebarGroup | null => {
  const { data: favorites } = useGetUserFavorites();
  const { mutateAsync: updateUserFavorites } = useUpdateUserFavorites();
  const { mutateAsync: deleteUserFavorite } = useDeleteUserFavorite();
  const matcher = useMatchRoute();

  useMount(() => {
    assetParamsToRoute({ assetType: 'chat', assetId: '123' });
  });

  return useMemo(() => {
    if (!favorites || favorites.length === 0) return null;

    return {
      label: 'Favorites',
      id: 'favorites',
      isSortable: true,
      onItemsReorder: updateUserFavorites,
      items: favorites.map<ISidebarItem>((favorite) => {
        const Icon = assetTypeToIcon(favorite.asset_type);
        const route = getFavoriteRoute(favorite);
        //  const isActive = !!matcher({ ...route, fuzzy: true } as Parameters<typeof matcher>[0]);
        return {
          label: favorite.name,
          icon: <Icon />,
          route,
          id: favorite.id,
          preload: 'intent',
          onRemove: () => deleteUserFavorite([favorite.id]),
        };
      }),
    } satisfies ISidebarGroup;
  }, [favorites, matcher, deleteUserFavorite]);
};
