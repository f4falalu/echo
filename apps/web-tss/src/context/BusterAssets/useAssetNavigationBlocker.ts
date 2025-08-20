import { useBlocker } from '@tanstack/react-router';
import { useOpenConfirmModal } from '../BusterNotifications';

export const useAssetNavigationBlocker = ({
  onResetToOriginal,
  isFileChanged,
}: {
  onResetToOriginal: () => void | Promise<void>;
  isFileChanged: boolean;
}) => {
  const openConfirmModal = useOpenConfirmModal();

  useBlocker({
    shouldBlockFn: async () => {
      if (!isFileChanged) return false;

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
