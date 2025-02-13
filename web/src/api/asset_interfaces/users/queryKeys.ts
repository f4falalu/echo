import { queryOptions } from '@tanstack/react-query';
import { BusterUserFavorite } from './interfaces';

const favoritesGetList = queryOptions<BusterUserFavorite[]>({
  queryKey: ['users', 'favorites', 'list'] as const
});

export const userQueryKeys = {
  '/favorites/list:getFavoritesList': favoritesGetList
};
