import { useBlocker } from '@tanstack/react-router';
import { useOpenConfirmModal } from '../BusterNotifications';

export const useAssetNavigationBlocker = ({
  onResetToOriginal,
  isFileChanged,
  enableBlocker = true,
}: {
  onResetToOriginal: () => void | Promise<void>;
  isFileChanged: boolean;
  enableBlocker?: boolean;
}) => {
  const openConfirmModal = useOpenConfirmModal();

  useBlocker({
    disabled: !enableBlocker,
    shouldBlockFn: async () => {
      if (!isFileChanged || !enableBlocker) return false;

      const shouldLeave = await openConfirmModal({
        title: 'Unsaved changes',
        content: 'Looks like you have unsaved changes. Are you sure you want to leave?',
        primaryButtonProps: {
          text: 'Yes, leave',
        },
        cancelButtonProps: {
          text: 'No, stay',
        },
        showClose: false,
        onOk: () => {
          onResetToOriginal();
          Promise.resolve(true);
        },
      });

      return !shouldLeave;
    },
  });
};
