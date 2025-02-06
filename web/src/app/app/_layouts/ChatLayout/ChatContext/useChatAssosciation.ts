import { useMemoizedFn } from 'ahooks';

export const useChatAssociation = ({ chatId }: { chatId?: string }) => {
  const onDeleteChat = useMemoizedFn(async (chatIdProp?: string) => {
    console.log('delete chat', chatIdProp);
  });

  return { onDeleteChat };
};
