import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import React, { useMemo } from 'react';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { Copy, Trash, TextA, Pencil } from '@/components/ui/icons';
import { duplicateChat, useDeleteChat, useDuplicateChat } from '@/api/buster_rest/chats';
import { CHAT_HEADER_TITLE_ID } from '../ChatHeaderTitle';
import { timeout } from '@/lib';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const { mutate: deleteChat } = useDeleteChat();
  const { mutate: duplicateChat } = useDuplicateChat();
  const currentMessageId = useChatIndividualContextSelector((state) => state.currentMessageId);

  const menuItem: DropdownItems = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        value: 'delete',
        icon: <Trash />,
        onClick: () => chatId && deleteChat([chatId])
      },
      {
        label: 'Duplicate chat',
        value: 'duplicate',
        icon: <Copy />,
        onClick: () =>
          chatId &&
          duplicateChat({ id: chatId, message_id: currentMessageId, share_with_same_people: false })
      },
      {
        label: 'Edit chat title',
        value: 'edit-chat-title',
        icon: <Pencil />,
        onClick: async () => {
          const input = document.getElementById(CHAT_HEADER_TITLE_ID) as HTMLInputElement;
          if (input) {
            await timeout(25);
            input.focus();
            input.select();
            console.log('input', input.select);
          }
        }
      }
    ];
  }, [chatId, currentMessageId, deleteChat, duplicateChat]);

  return <Dropdown items={menuItem}>{chatId ? children : null}</Dropdown>;
});

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
