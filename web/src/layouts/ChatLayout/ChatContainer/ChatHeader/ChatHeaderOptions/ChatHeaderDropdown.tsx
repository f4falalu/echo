import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import React, { useMemo } from 'react';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { Trash } from '@/components/ui/icons';
import { useBusterChatContextSelector } from '@/context/Chats';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const onDeleteChat = useBusterChatContextSelector((x) => x.onDeleteChat);

  const menuItem: DropdownItems = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        value: 'delete',
        icon: <Trash />,
        onClick: () => chatId && onDeleteChat(chatId)
      }
    ];
  }, []);

  return (
    <div>
      <Dropdown items={menuItem}>{chatId ? children : null}</Dropdown>
    </div>
  );
});

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
