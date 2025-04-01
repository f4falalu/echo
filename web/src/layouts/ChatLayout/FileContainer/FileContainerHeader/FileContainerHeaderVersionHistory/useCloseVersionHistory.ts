import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout/ChatLayoutContext';
import { timeout } from '@/lib';
import { useTransition } from 'react';

export const useCloseVersionHistory = () => {
  const [isPending, startTransition] = useTransition();
  const chatId = useChatLayoutContextSelector((x) => x.chatId);
  const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
  const closeSecondaryView = useChatLayoutContextSelector((x) => x.closeSecondaryView);

  const removeVersionHistoryQueryParams = useMemoizedFn(async () => {
    closeSecondaryView();
    await timeout(chatId ? 250 : 0);
    startTransition(() => {
      onChangeQueryParams({ metric_version_number: null, dashboard_version_number: null });
    });
  });

  return removeVersionHistoryQueryParams;
};
