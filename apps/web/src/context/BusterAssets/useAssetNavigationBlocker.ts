import type { AssetType } from '@buster/server-shared/assets';
import { useBlockerWithModal } from '../Routes/useBlockerWithModal';

export const useAssetNavigationBlocker = ({
  onResetToOriginal,
  isFileChanged,
  enableBlocker = true,
  assetType,
}: {
  onResetToOriginal: () => void | Promise<void>;
  isFileChanged: boolean;
  enableBlocker?: boolean;
  assetType: AssetType;
}) => {
  return useBlockerWithModal({
    onReset: onResetToOriginal,
    enableBlocker: isFileChanged && enableBlocker,
    title: 'Unsaved changes',
    content: `Looks like you have unsaved changes for your ${assetType}. Are you sure you want to leave?`,
  });
};
