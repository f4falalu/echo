import { AppMaterialIcons } from '@/components/ui';
import { Button } from 'antd';
import React from 'react';

export const ShareButton = React.memo(() => {
  return <Button type="text" icon={<AppMaterialIcons icon="share_windows" />} />;
});

ShareButton.displayName = 'ShareButton';
