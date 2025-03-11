import { useMemoizedFn } from '@/hooks';
import type { BusterUserFavorite } from '@/api/asset_interfaces/users';
import isEmpty from 'lodash/isEmpty';
import {
  useAddUserFavorite,
  useDeleteUserFavorite,
  useGetUserFavorites
} from '@/api/buster_rest/users';

const DEFAULT_FAVORITES: BusterUserFavorite[] = [];

export const useFavoriteProvider = () => {
  const { data: userFavorites, refetch: refreshFavoritesList } = useGetUserFavorites();

  const { mutate: addItemToFavorite } = useAddUserFavorite();

  const { mutate: removeItemFromFavorite } = useDeleteUserFavorite();

  const bulkEditFavorites = useMemoizedFn(async (favorites: string[]) => {
    // return updateFavorites({ favorites });
    alert('TODO - feature not implemented yet');
  });

  return {
    bulkEditFavorites,
    refreshFavoritesList,
    userFavorites: isEmpty(userFavorites) ? DEFAULT_FAVORITES : userFavorites!,
    addItemToFavorite,
    removeItemFromFavorite
  };
};
