import { useBlocker } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { ConfirmProps } from '@/components/ui/modal/ConfirmModal';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useUnmount } from '@/hooks/useUnmount';
import { timeout } from '@/lib/timeout';
import { useOpenConfirmModal } from '../BusterNotifications';
import { setBlocker, useCooldownTimer } from './blocker-store';

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
  const { cooldownBlockerTimer, startCooldownTimer, cancelCooldownTimer } = useCooldownTimer();
  const openConfirmModal = useOpenConfirmModal();

  const isBlockerDisabled = !enableBlocker || !!cooldownBlockerTimer;

  const ensureBlockerIsUnBlocked = useMemoizedFn(async (iteration = 0) => {
    if (enableBlocker === false || iteration > 30) {
      return true;
    }

    await timeout(5);
    return ensureBlockerIsUnBlocked(iteration + 1);
  });

  //this must be a moized funciton because shouldBlockFn caches the function
  const checkShouldBlockFn = useMemoizedFn(() => {
    if (isBlockerDisabled) return true;
    return false;
  });

  useUnmount(() => {
    cancelCooldownTimer();
  });

  useEffect(() => {
    setBlocker(enableBlocker);
  }, [enableBlocker]);

  useBlocker({
    disabled: isBlockerDisabled,
    shouldBlockFn: async () => {
      if (checkShouldBlockFn()) return false;

      const shouldLeave = await openConfirmModal<true>({
        title: title || 'Unsaved changes',
        content,
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
          await timeout(25);
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
