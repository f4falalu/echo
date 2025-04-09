import { ShareAssetType } from '@/api/asset_interfaces/share';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites
} from '@/api/buster_rest/users';
import { DropdownItems } from '@/components/ui/dropdown';
import { Star, Xmark } from '@/components/ui/icons';
import { useMemo } from 'react';

export const useThreeDotFavoritesOptions = ({
  itemIds,
  assetType,
  onFinish
}: {
  itemIds: string[];
  assetType: ShareAssetType;
  onFinish: (ids: string[]) => void;
}) => {
  const { mutateAsync: addUserFavorite } = useAddUserFavorite();
  const { mutateAsync: removeUserFavorite } = useDeleteUserFavorite();
  const { data: userFavorites } = useGetUserFavorites();

  const dropdownOptions: DropdownItems = useMemo(
    () => [
      {
        label: 'Add to favorites',
        icon: <Star />,
        value: 'add-to-favorites',
        onClick: async () => {
          await addUserFavorite([
            ...itemIds.map((id) => ({
              id,
              asset_type: assetType,
              name: userFavorites?.find((f) => f.id === id)?.name || ''
            }))
          ]);
          onFinish(itemIds);
        }
      },
      {
        label: 'Remove from favorites',
        icon: <Xmark />,
        value: 'remove-from-favorites',
        onClick: async () => {
          await removeUserFavorite(itemIds);
          onFinish(itemIds);
        }
      }
    ],
    [addUserFavorite, removeUserFavorite, itemIds, assetType, userFavorites]
  );

  return dropdownOptions;
};
