import { useMemoizedFn } from 'ahooks';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useSocketQueryEmitAndOnce, useSocketQueryMutation } from '@/api/buster_socket_query';

export const useChatAssosciations = () => {
  const busterSocket = useBusterWebSocket();
  const x = useSocketQueryMutation('');

  const onDeleteChat = useMemoizedFn(async (chatId: string) => {
    //
    // await busterSocket.emit({
    //   route: '/chats/delete',
    //   payload: { id: chatId }
    // });
  });

  return {
    onDeleteChat
  };
};
