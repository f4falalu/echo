import { Dropdown, MenuProps } from 'antd';
import React, { useMemo } from 'react';
import { useChatSplitterContextSelector } from '../../../ChatLayoutContext';
import { HeaderOptionsRecord } from './config';

export const ChatContainerHeaderDropdown: React.FC<{
  children: React.ReactNode;
}> = React.memo(({ children }) => {
  const selectedFileType = useChatSplitterContextSelector((state) => state.selectedFileType);

  const menuItem: MenuProps['items'] = useMemo(() => {
    if (!selectedFileType) return [] as MenuProps['items'];
    return HeaderOptionsRecord[selectedFileType]();
  }, [selectedFileType]);

  const menu = useMemo(() => {
    return {
      items: menuItem
    };
  }, [menuItem]);

  return (
    <div>
      <Dropdown menu={menu} trigger={['click']}>
        {children}
      </Dropdown>
    </div>
  );
});

ChatContainerHeaderDropdown.displayName = 'ChatContainerHeaderDropdown';
