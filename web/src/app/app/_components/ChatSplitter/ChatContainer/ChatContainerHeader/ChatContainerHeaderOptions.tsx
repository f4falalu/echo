import { AppMaterialIcons } from '@/components';
import { Button } from 'antd';
import React from 'react';

export const ChatContainerHeaderOptions: React.FC<{}> = React.memo(() => {
  return (
    <div>
      <Button type="text" icon={<AppMaterialIcons icon="more_horiz" />} />
    </div>
  );
});

ChatContainerHeaderOptions.displayName = 'ChatContainerHeaderOptions';
