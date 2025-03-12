import type { ShareAssetType } from '@/api/asset_interfaces/share';

export interface UsersFavoritePostPayload {
  id: string;
  asset_type: ShareAssetType;
  index?: number;
  name: string;
}

export type UserFavoriteDeletePayload = {
  id: string;
  asset_type: ShareAssetType;
}[];

export interface UserUpdateFavoritesPayload {
  favorites: string[]; // Array of favorite ids
}

export interface UserRequestUserListPayload {
  team_id: string;
  page?: number;
  page_size?: number;
}
