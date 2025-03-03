import { BusterShare, ShareRole } from '@/api/asset_interfaces';

export const isShareMenuVisible = (shareAssetConfig: BusterShare | null) => {
  return (
    !!shareAssetConfig &&
    (shareAssetConfig.permission === ShareRole.OWNER ||
      shareAssetConfig.permission === ShareRole.EDITOR)
  );
};
