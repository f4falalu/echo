import type { ShareRole } from '@buster/server-shared/share';
import type { IBusterChat } from '../../api/asset_interfaces';
import { useGetChat } from '../../api/buster_rest/chats';

const stablePermissionSelector = (chat: IBusterChat): ShareRole => chat.permission;

export const useChatPermission = (chatId: string | undefined): ShareRole | undefined => {
  const { data: permission } = useGetChat(
    { id: chatId || '' },
    {
      select: stablePermissionSelector,
      enabled: !!chatId,
    }
  );

  return permission;
};
