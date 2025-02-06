import { Dropdown, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useChatContextSelector } from '../../../ChatContext';
import { AppMaterialIcons } from '@/components/icons';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const hasChat = useChatContextSelector((state) => state.hasChat);
  const onDeleteChat = useChatContextSelector((state) => state.onDeleteChat);

  const menuItem: MenuProps['items'] = useMemo(() => {
    return [
      {
        label: 'Delete chat',
        key: 'delete',
        icon: <AppMaterialIcons icon="delete" />,
        onClick: () => onDeleteChat()
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
        {hasChat ? children : null}
      </Dropdown>
    </div>
  );
});

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
