import type { BusterSocketRequestBase } from '../base_interfaces';
import type {
  UserColorsCreatePayload,
  UserColorsUpdatePayload,
  UserColorsDeletePayload,
  UsersFavoritePostPayload,
  UserFavoriteDeletePayload,
  UserUpdateFavoritesPayload,
  UserRequestUserListPayload
} from '@/api/request_interfaces/user/interfaces';

export type UserColorsList = BusterSocketRequestBase<'/users/colors/list', {}>;

export type UserColorsCreate = BusterSocketRequestBase<
  '/users/colors/post',
  UserColorsCreatePayload
>;

export type UserColorsUpdate = BusterSocketRequestBase<
  '/users/colors/update',
  UserColorsUpdatePayload
>;

export type UserColorsDelete = BusterSocketRequestBase<
  '/users/colors/delete',
  UserColorsDeletePayload
>;

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
  | UserColorsList
  | UserColorsCreate
  | UserColorsUpdate
  | UserColorsDelete
  | UsersFavoritePost
  | UsersFavoriteList
  | UserFavoriteDelete
  | UserUpdateFavorites
  | UserRequestUserList;
