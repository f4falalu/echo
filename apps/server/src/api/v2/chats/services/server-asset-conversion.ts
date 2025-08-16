import type { DatabaseAssetType } from '@buster/database';
import type { ChatAssetType } from '@buster/server-shared/chats';

//TODO - updated the database to avoid this conversion
const chatAssetTypeToDatabaseAssetType: Partial<Record<ChatAssetType, DatabaseAssetType>> = {
  metric: 'metric_file',
  dashboard: 'dashboard_file',
  report: 'report_file',
};

export const convertChatAssetTypeToDatabaseAssetType = (
  assetType: ChatAssetType
): DatabaseAssetType => {
  // For the ones that need conversion, use the mapping
  const mapped = chatAssetTypeToDatabaseAssetType[assetType];
  if (mapped) {
    return mapped;
  }

  // Default fallback for unmapped types
  throw new Error(`Cannot convert asset type '${assetType}' to database asset type`);
};
