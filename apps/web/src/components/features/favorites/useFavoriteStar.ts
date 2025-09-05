import type { ShareAssetType } from '@buster/server-shared/share';
import { useMemo } from 'react';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites,
} from '@/api/buster_rest/users';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useFavoriteStar = ({
  id,
  type,
  name,
}: {
  id: string;
  type: ShareAssetType;
  name: string;
}) => {
  const { data: userFavorites } = useGetUserFavorites();
  const { mutateAsync: removeItemFromFavorite } = useDeleteUserFavorite();
  const { mutateAsync: addItemToFavorite } = useAddUserFavorite();

  const isFavorited = useMemo(() => {
    return userFavorites?.some((favorite) => favorite.id === id);
  }, [userFavorites, id]);

  const onFavoriteClick = useMemoizedFn(
    async (e?: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (!isFavorited) {
        return await addItemToFavorite([
          {
            asset_type: type,
            id,
            name,
          },
        ]);
      }

      return await removeItemFromFavorite([id]);
    }
  );

  return useMemo(
    () => ({
      isFavorited,
      onFavoriteClick,
    }),
    [isFavorited, onFavoriteClick]
  );
};
