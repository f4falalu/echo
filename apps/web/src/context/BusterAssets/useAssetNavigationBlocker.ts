import type { AssetType } from '@buster/server-shared/assets';
import { useBlocker } from '@tanstack/react-router';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { timeout } from '@/lib/timeout';
import { useOpenConfirmModal } from '../BusterNotifications';

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
  const openConfirmModal = useOpenConfirmModal();

  const ensureBlockerIsUnBlocked = useMemoizedFn(async (iteration = 0) => {
    if (iteration > 15) {
      return true;
    }

    if (enableBlocker === false) {
      return true;
    }

    await timeout(20);
    return ensureBlockerIsUnBlocked(iteration + 1);
  });

  useBlocker({
    disabled: !enableBlocker,
    shouldBlockFn: async () => {
      if (!isFileChanged || !enableBlocker) return false;

      const shouldLeave = await openConfirmModal<true>({
        title: 'Unsaved changes',
        content: `Looks like you have unsaved changes for your ${assetType}. Are you sure you want to leave?`,
        primaryButtonProps: {
          text: 'Yes, leave',
        },
        cancelButtonProps: {
          text: 'No, stay',
        },
        showClose: false,
        onOk: async () => {
          await onResetToOriginal();
          await ensureBlockerIsUnBlocked();
          return Promise.resolve(true);
        },
      });

      return !shouldLeave;
    },
    withResolver: false,
  });
};
