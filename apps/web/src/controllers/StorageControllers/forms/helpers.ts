import { useNavigate } from '@tanstack/react-router';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useConfetti } from '@/hooks/useConfetti';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';

export const useStorageFormSuccess = () => {
  const { openConfirmModal } = useBusterNotifications();
  const { fireConfetti } = useConfetti();
  const navigate = useNavigate();

  return useMemoizedFn(async ({ onCreate }: { onCreate: () => Promise<unknown> }) => {
    await onCreate();
    fireConfetti(9999);
    openConfirmModal({
      preventCloseOnClickOutside: true,
      title: 'Storage connected',
      description:
        'Your storage has been successfully connected. You can now use it to store and retrieve files.',
      content: null,
      primaryButtonProps: {
        text: 'Continue to integrations',
      },
      cancelButtonProps: {
        hide: true,
      },
      showClose: false,
      onOk: () =>
        navigate({
          to: '/app/settings/integrations',
        }),
    });
  });
};
