import type { IBusterChat } from '../../api/asset_interfaces';
import { useGetChat } from '../../api/buster_rest/chats';

const stableHasLoadedChat = (x: IBusterChat) => !!x.id;
export const useHasLoadedChat = ({ chatId }: { chatId: string }) => {
  const { data: hasLoadedChat } = useGetChat(
    { id: chatId },
    { select: stableHasLoadedChat, notifyOnChangeProps: ['data'] }
  );
  return hasLoadedChat;
};
