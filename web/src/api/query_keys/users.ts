import { queryOptions } from '@tanstack/react-query';
import type { BusterUserFavorite, BusterUserResponse } from '@/api/asset_interfaces';

const favoritesGetList = queryOptions<BusterUserFavorite[]>({
  queryKey: ['users', 'favorites', 'list'] as const
});

const userGetUserMyself = queryOptions<BusterUserResponse>({
  queryKey: ['users', 'myself'] as const
});

const userGetUser = (userId: string) =>
  queryOptions<BusterUserResponse>({
    queryKey: ['users', userId] as const
  });

export const userQueryKeys = {
  '/favorites/list:getFavoritesList': favoritesGetList,
  '/users/response:getUserMyself': userGetUserMyself,
  '/users/response:getUser': userGetUser
};
