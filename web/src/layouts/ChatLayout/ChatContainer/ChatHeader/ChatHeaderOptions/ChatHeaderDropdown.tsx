import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import React, { useMemo } from 'react';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { Trash } from '@/components/ui/icons';
import { useDeleteChat } from '@/api/buster_rest/chats';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const { mutate: deleteChat } = useDeleteChat();
  const menuItem: DropdownItems = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        value: 'delete',
        icon: <Trash />,
        onClick: () => chatId && deleteChat([chatId])
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
