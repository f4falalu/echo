import type { AssetType } from '@buster/server-shared/assets';
import { useBlocker } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useUnmount } from '@/hooks/useUnmount';
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
  const [explicitlyUnblocked, setExplicitlyUnblocked] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const openConfirmModal = useOpenConfirmModal();

  const cancelCooldownTimer = () => {
    if (cooldownTimer.current) {
      clearTimeout(cooldownTimer.current);
      cooldownTimer.current = undefined;
    }
    setExplicitlyUnblocked(false);
  };

  const startCooldownTimer = () => {
    setExplicitlyUnblocked(true);
    cooldownTimer.current = setTimeout(() => {
      cancelCooldownTimer();
    }, 500);
  };

  const ensureBlockerIsUnBlocked = useMemoizedFn(async (iteration = 0) => {
    if (enableBlocker === false || iteration > 30) {
      return true;
    }

    await timeout(5);
    return ensureBlockerIsUnBlocked(iteration + 1);
  });

  useUnmount(() => {
    cancelCooldownTimer();
  });

  useBlocker({
    disabled: !enableBlocker || explicitlyUnblocked,
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
          startCooldownTimer();
          return Promise.resolve(true);
        },
        onCancel: async () => {
          startCooldownTimer();
        },
      });

      return !shouldLeave;
    },
    enableBeforeUnload: isFileChanged,
    withResolver: false,
  });
};
