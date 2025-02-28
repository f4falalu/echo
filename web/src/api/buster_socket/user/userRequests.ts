import type { BusterSocketRequestBase } from '../base_interfaces';
import type {
  UsersFavoritePostPayload,
  UserFavoriteDeletePayload,
  UserUpdateFavoritesPayload,
  UserRequestUserListPayload
} from '@/api/request_interfaces/user/interfaces';

export type UsersFavoritePost = BusterSocketRequestBase<
  '/users/favorites/post',
  UsersFavoritePostPayload
>;

export type UsersFavoriteList = BusterSocketRequestBase<'/users/favorites/list', {}>;

export type UserFavoriteDelete = BusterSocketRequestBase<
  '/users/favorites/delete',
  UserFavoriteDeletePayload
>;

export type UserUpdateFavorites = BusterSocketRequestBase<
  '/users/favorites/update',
  UserUpdateFavoritesPayload
>;

export type UserRequestUserList = BusterSocketRequestBase<
  '/users/list',
  UserRequestUserListPayload
>;

export type UserEmits =
  | UsersFavoritePost
  | UsersFavoriteList
  | UserFavoriteDelete
  | UserUpdateFavorites
  | UserRequestUserList;
