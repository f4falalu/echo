import type { DatabaseAssetType } from '@buster/database';
import type { ChatAssetType } from '@buster/server-shared/chats';

const chatAssetTypeToDatabaseAssetType: Record<ChatAssetType, DatabaseAssetType> = {
  metric: 'metric_file',
  dashboard: 'dashboard_file',
};

export const convertChatToAssetChat = (assetType: ChatAssetType): DatabaseAssetType => {
  return chatAssetTypeToDatabaseAssetType[assetType];
};
