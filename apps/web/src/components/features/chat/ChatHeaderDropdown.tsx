import type React from 'react';
import { useMemo } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces';
import { useGetChat } from '@/api/buster_rest/chats';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { getIsEffectiveOwner } from '@/lib/share';
import {
  useDeleteChatSelectMenu,
  useDuplicateChatSelectMenu,
  useFavoriteChatSelectMenu,
  useOpenInNewTabSelectMenu,
  useRenameChatTitle,
  useShareMenuSelectMenu,
} from './threeDotMenuHooks';

const stablePermissionSelector = (chat: IBusterChat) => chat.permission;

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const chatId = useGetChatId();
  const { data: permission } = useGetChat(
    { id: chatId || '' },
    { select: stablePermissionSelector }
  );
  const shareMenu = useShareMenuSelectMenu({ chatId });
  const renameChatTitle = useRenameChatTitle();
  const favoriteChat = useFavoriteChatSelectMenu({ chatId });
  const openInNewTab = useOpenInNewTabSelectMenu({ chatId });
  const duplicateChat = useDuplicateChatSelectMenu({ chatId });
  const deleteChat = useDeleteChatSelectMenu({ chatId });

  const isOwnerEffective = getIsEffectiveOwner(permission);

  const menuItem: IDropdownItems = useMemo(() => {
    return [
      isOwnerEffective && shareMenu,
      isOwnerEffective && renameChatTitle,
      favoriteChat,
      openInNewTab,
      { type: 'divider' },
      duplicateChat,
      deleteChat,
    ].filter(Boolean) as IDropdownItems;
  }, [chatId, duplicateChat, deleteChat, duplicateChat]);

  return (
    <Dropdown align="end" items={menuItem}>
      {chatId ? children : null}
    </Dropdown>
  );
};

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
