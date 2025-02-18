import type { ShareAssetType } from '@/api/asset_interfaces';

export interface UserColorsCreatePayload {
  color_palette: string[];
}

export interface UserColorsUpdatePayload {
  id: string;
  color_palette: string[];
}

export interface UserColorsDeletePayload {
  id: string;
}

export interface UsersFavoritePostPayload {
  id: string;
  asset_type: ShareAssetType;
  index?: number;
  name: string;
}

export interface UserFavoriteDeletePayload {
  id: string;
  asset_type: ShareAssetType;
}

export interface UserUpdateFavoritesPayload {
  favorites: string[]; // Array of favorite ids
}

export interface UserRequestUserListPayload {
  team_id: string;
  page?: number;
  page_size?: number;
}
