import { useNavigate } from '@tanstack/react-router';
import type React from 'react';
import { useMemo } from 'react';
import { useDeleteChat, useDuplicateChat, useGetChat } from '@/api/buster_rest/chats';
import { useFavoriteStar } from '@/components/features/favorites';
import { Dropdown, type IDropdownItems } from '@/components/ui/dropdown';
import { DuplicatePlus, Pencil, Star, Trash } from '@/components/ui/icons';
import { Star as StarFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useGetChatId } from '@/context/Chats/useGetChatId';
import { timeout } from '@/lib/timeout';
import { CHAT_HEADER_TITLE_ID } from '../ChatHeaderTitle';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { openSuccessMessage } = useBusterNotifications();
  const chatId = useGetChatId();
  const navigate = useNavigate();
  const { mutate: deleteChat, isPending: isDeleting } = useDeleteChat();
  const { mutateAsync: duplicateChat, isPending: isDuplicating } = useDuplicateChat();

  const { data: chatTitle } = useGetChat(
    { id: chatId || '' },
    { select: (x) => x.title, enabled: !!chatId }
  );

  const { isFavorited, onFavoriteClick } = useFavoriteStar({
    id: chatId || '',
    type: 'chat',
    name: chatTitle || '',
  });

  const menuItem: IDropdownItems = useMemo(() => {
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
                navigate({ to: '/app/chats' });
                openSuccessMessage('Chat deleted');
              },
            }
          ),
      },
      {
        label: 'Duplicate chat',
        value: 'duplicate',
        icon: <DuplicatePlus />,
        loading: isDuplicating,
        onClick: async () => {
          if (chatId) {
            const res = await duplicateChat({ id: chatId });
            await timeout(100);
            await navigate({ to: '/app/chats/$chatId', params: { chatId: res.id } });
            openSuccessMessage('Chat duplicated');
          }
        },
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
        },
      },
      {
        label: isFavorited ? 'Remove from favorites' : 'Add to favorites',
        value: 'add-to-favorites',
        icon: isFavorited ? <StarFilled /> : <Star />,
        onClick: onFavoriteClick,
      },
    ];
  }, [
    chatId,
    isDeleting,
    isDuplicating,
    deleteChat,
    duplicateChat,
    isFavorited,
    onFavoriteClick,
    openSuccessMessage,
    navigate,
  ]);

  return (
    <Dropdown align="end" items={menuItem}>
      {chatId ? children : null}
    </Dropdown>
  );
};

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
