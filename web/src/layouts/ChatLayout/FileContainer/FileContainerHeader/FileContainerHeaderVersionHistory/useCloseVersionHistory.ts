import { useGetFileLink } from '@/context/Assets/useGetFileLink';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { timeout } from '@/lib';
import { useTransition } from 'react';

export const useCloseVersionHistory = () => {
  const [isPending, startTransition] = useTransition();
  const { getFileLink } = useGetFileLink();
  const closeSecondaryView = useChatLayoutContextSelector((x) => x.closeSecondaryView);
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const onCloseVersionHistory = useMemoizedFn(
    async ({
      assetId,
      type,
      chatId
    }: {
      assetId: string;
      type: 'metric' | 'dashboard';
      chatId: string | undefined;
    }) => {
      closeSecondaryView();
      await timeout(chatId ? 250 : 0); //wait for the secondary view to close
      startTransition(() => {
        const link = getFileLink({
          fileId: assetId,
          fileType: type,
          chatId
        });
        if (link) onChangePage(link);
      });
    }
  );

  return onCloseVersionHistory;
};
