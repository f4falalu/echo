import { useMatchRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import {
  useDeleteUserFavorite,
  useGetUserFavorites,
  useUpdateUserFavorites,
} from '@/api/buster_rest/users';
import { assetTypeToIcon } from '@/components/features/icons/assetIcons';
import type { ISidebarGroup } from '@/components/ui/sidebar';
import { useMount } from '@/hooks/useMount';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import { createSimpleAssetRoute } from '@/lib/routes/createSimpleAssetRoute';
import { createSidebarItem } from '../../../ui/sidebar/create-sidebar-item';

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
      items: favorites.map((favorite) => {
        const Icon = assetTypeToIcon(favorite.asset_type);
        const link = createSimpleAssetRoute(favorite);

        return createSidebarItem({
          label: favorite.name,
          icon: <Icon />,
          link,
          id: favorite.id,
          onRemove: () => deleteUserFavorite([favorite.id]),
        });
      }),
    } satisfies ISidebarGroup;
  }, [favorites, matcher, deleteUserFavorite]);
};
