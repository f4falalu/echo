import type { ShareAssetType } from '@/api/asset_interfaces/share';

export type UsersFavoritePostPayload = {
  id: string;
  asset_type: ShareAssetType;
  index?: number;
  name: string; //just used for the UI for optimistic update
};

export interface UserRequestUserListPayload {
  team_id: string;
  page?: number;
  page_size?: number;
}
