import { AppMaterialIcons } from '@/components/icons';
import { Button } from 'antd';
import React from 'react';
import { ChatContainerHeaderDropdown } from './ChatHeaderDropdown';

export const ChatHeaderOptions: React.FC<{}> = React.memo(() => {
  return (
    <ChatContainerHeaderDropdown>
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />} />
    </ChatContainerHeaderDropdown>
  );
});

ChatHeaderOptions.displayName = 'ChatHeaderOptions';
