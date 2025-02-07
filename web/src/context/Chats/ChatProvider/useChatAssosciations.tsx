import { useMemoizedFn } from 'ahooks';
import { useBusterWebSocket } from '../../BusterWebSocket';

export const useChatAssosciations = () => {
  const busterSocket = useBusterWebSocket();

  const onDeleteChat = useMemoizedFn(async (chatId: string) => {
    await busterSocket.emit({
      route: '/chats/delete',
      payload: { id: chatId }
    });
  });

  return {
    onDeleteChat
  };
};
