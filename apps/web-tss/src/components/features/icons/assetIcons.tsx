import type { ShareAssetType } from '@buster/server-shared/share';
import {
  FileText,
  Folder5,
  FolderPlus,
  Grid,
  GridPlus,
  Messages,
  SquareChart,
  Table,
} from '@/components/ui/icons';

export const ASSET_ICONS = {
  metrics: SquareChart,
  chats: Messages,
  dashboards: Grid,
  collections: Folder5,
  dashboardAdd: GridPlus,
  collectionAdd: FolderPlus,
  table: Table,
  reports: FileText,
};

export const assetTypeToIcon = (assetType: ShareAssetType) => {
  switch (assetType) {
    case 'metric':
      return ASSET_ICONS.metrics;
    case 'dashboard':
      return ASSET_ICONS.dashboards;
    case 'collection':
      return ASSET_ICONS.collections;
    case 'chat':
      return ASSET_ICONS.chats;
    case 'report':
      return ASSET_ICONS.reports;
    default: {
      const _result: never = assetType;
      console.warn('Asset type to icon not found', assetType);
      return ASSET_ICONS.metrics;
    }
  }
};
