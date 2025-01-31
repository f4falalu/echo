import { ShareAssetType } from '@/api/asset_interfaces';
import { AppMaterialIcons } from '@/components';

const iconRecord: Record<ShareAssetType, string> = {
  [ShareAssetType.COLLECTION]: 'note_stack',
  [ShareAssetType.DASHBOARD]: 'grid_view',
  [ShareAssetType.METRIC]: 'monitoring'
};

export const asset_typeToIcon = (
  type: ShareAssetType,
  props?: { open?: boolean; size?: number }
) => {
  const { open, size } = props || {};
  const iconString = iconRecord[type];
  return <AppMaterialIcons icon={iconString as 'grid_view'} size={size} />;
};

export const asset_typeToTranslation = (type: ShareAssetType) => {
  const asset_typeTranslation: Record<ShareAssetType, string> = {
    [ShareAssetType.COLLECTION]: 'collection',
    [ShareAssetType.DASHBOARD]: 'dashboard',
    [ShareAssetType.METRIC]: 'thread'
  };
  return asset_typeTranslation[type];
};
