import { useBlocker } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import type { ConfirmProps } from '@/components/ui/modal/ConfirmModal';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useUnmount } from '@/hooks/useUnmount';
import { timeout } from '@/lib/timeout';
import { useOpenConfirmModal } from '../BusterNotifications';
import { setBlocker } from './blocker-store';

export const useBlockerWithModal = ({
  onReset,
  enableBlocker = true,
  title,
  content,
  primaryButtonProps,
  cancelButtonProps,
  enableBeforeUnload = true,
}: {
  onReset: () => void | Promise<void>;
  enableBlocker?: boolean;
  title?: string;
  content: string;
  primaryButtonProps?: ConfirmProps['primaryButtonProps'];
  cancelButtonProps?: ConfirmProps['cancelButtonProps'];
  enableBeforeUnload?: boolean;
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

  useEffect(() => {
    setBlocker(enableBlocker);
  }, [enableBlocker]);

  useBlocker({
    disabled: !enableBlocker || explicitlyUnblocked,
    shouldBlockFn: async () => {
      if (!enableBlocker) return false;

      const shouldLeave = await openConfirmModal<true>({
        title: title || 'Unsaved changes',
        content: content,
        primaryButtonProps: primaryButtonProps || {
          text: 'Yes, leave',
        },
        cancelButtonProps: cancelButtonProps || {
          text: 'No, stay',
        },
        showClose: false,
        onOk: async () => {
          await onReset();
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
    enableBeforeUnload,
    withResolver: false,
  });
};
