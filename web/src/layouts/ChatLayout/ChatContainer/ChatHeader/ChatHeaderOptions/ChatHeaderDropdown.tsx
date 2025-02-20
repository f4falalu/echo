import { Dropdown, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useChatIndividualContextSelector } from '../../../ChatContext';
import { AppMaterialIcons } from '@/components/ui';
import { useBusterChatContextSelector } from '@/context/Chats';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const chatId = useChatIndividualContextSelector((state) => state.chatId);
  const onDeleteChat = useBusterChatContextSelector((x) => x.onDeleteChat);

  const menuItem: MenuProps['items'] = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        key: 'delete',
        icon: <AppMaterialIcons icon="delete" />,
        onClick: () => chatId && onDeleteChat(chatId)
      }
    ];
  }, []);

  const menu = useMemo(() => {
    return {
      items: menuItem
    };
  }, [menuItem]);

  return (
    <div>
      <Dropdown menu={menu} trigger={['click']}>
        {chatId ? children : null}
      </Dropdown>
    </div>
  );
});

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
