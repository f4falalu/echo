import { useBlocker } from '@tanstack/react-router';
import { useOpenConfirmModal } from '@/context/BusterNotifications';

export const useDatasetBlocker = ({
  disablePublish,
  onPublishDataset,
  resetDataset,
}: {
  disablePublish: boolean;
  onPublishDataset: () => Promise<void>;
  resetDataset: (() => Promise<void>) | (() => void);
}) => {
  const preventNavigation = !disablePublish;
  const openConfirmModal = useOpenConfirmModal();

  useBlocker({
    disabled: !disablePublish,
    shouldBlockFn: async () => {
      if (!preventNavigation) return false;

      const shouldLeave = await openConfirmModal<true>({
        title: 'Would you like to publish your changes to this dataset?',
        content:
          'You are about to leave this page without publishing changes. Would you like to publish your changes before you leave?',
        primaryButtonProps: {
          text: 'Publish changes',
        },
        cancelButtonProps: {
          text: 'Discard changes',
        },
        showClose: false,
        onOk: async () => {
          await onPublishDataset();
          return Promise.resolve(true);
        },
        onCancel: async () => {
          await resetDataset();
        },
      });

      return !shouldLeave;
    },
    enableBeforeUnload: false,
    withResolver: false,
  });
};

// <PreventNavigation
// isDirty={preventNavigation}
// title="Would you like to publish your changes to this dataset?"
// description="You are about to leave this page without publishing changes. Would you like to publish your changes before you leave?"
// okText="Publish changes"
// cancelText="Discard changes"
// onOk={onPublishDataset}
// onCancel={onCancelPreventNavigation}
// />
