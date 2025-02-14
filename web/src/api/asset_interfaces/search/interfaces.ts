import type { ShareAssetType } from '@/api/asset_interfaces';

export interface BusterSearchResult {
  id: string;
  highlights: string[];
  name: string;
  updated_at: string;
  type: ShareAssetType;
  score: number;
}
