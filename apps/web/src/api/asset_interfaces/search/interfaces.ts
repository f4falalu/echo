import type { ShareAssetType } from '@buster/server-shared/share';

export interface BusterSearchResult {
  id: string;
  highlights: string[];
  name: string;
  updated_at: string;
  type: ShareAssetType;
  score: number;
}
