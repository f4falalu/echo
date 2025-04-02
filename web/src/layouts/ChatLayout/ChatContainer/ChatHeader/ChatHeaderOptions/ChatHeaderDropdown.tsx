import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import React, { useMemo } from 'react';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { Copy, Trash, Pencil } from '@/components/ui/icons';
import { useDeleteChat, useDuplicateChat } from '@/api/buster_rest/chats';
import { CHAT_HEADER_TITLE_ID } from '../ChatHeaderTitle';
import { timeout } from '@/lib';
import { BusterRoutes } from '@/routes';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useBusterNotifications } from '@/context/BusterNotifications';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat();
  const { mutateAsync: duplicateChat, isPending: isDuplicating } = useDuplicateChat();
  const currentMessageId = useChatIndividualContextSelector((state) => state.currentMessageId);

  const menuItem: DropdownItems = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        value: 'delete',
        icon: <Trash />,
        loading: isDeleting,
        onClick: () =>
          chatId &&
          deleteChat(
            { data: [chatId] },
            {
              onSuccess: () => {
                onChangePage({ route: BusterRoutes.APP_CHAT });
                openSuccessMessage('Chat deleted');
              }
            }
          )
      },
      {
        label: 'Duplicate chat',
        value: 'duplicate',
        icon: <Copy />,
        loading: isDuplicating,
        onClick: async () => {
          if (chatId) {
            duplicateChat(
              { id: chatId, message_id: currentMessageId },
              {
                onSuccess: (chat) => {
                  onChangePage({ route: BusterRoutes.APP_CHAT_ID, chatId: chat.id });
                  openSuccessMessage('Chat duplicated');
                }
              }
            );
          }
        }
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
          }
        }
      }
    ];
  }, [chatId, isDeleting, currentMessageId, deleteChat, duplicateChat]);

  return (
    <Dropdown align="end" items={menuItem}>
      {chatId ? children : null}
    </Dropdown>
  );
});

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
