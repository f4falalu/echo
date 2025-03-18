import { queryOptions } from '@tanstack/react-query';
import type { PublicAssetResponse } from '../buster_rest/assets/interface';
import { FileType } from '../asset_interfaces';

const assetCheck = (assetId: string, fileType: FileType) =>
  queryOptions<PublicAssetResponse>({
    queryKey: ['assetCheck', fileType, assetId],
    staleTime: 30 * 1000 * 60 // 30 minutes
  });

export const assetQueryKeys = {
  assetCheck
};
