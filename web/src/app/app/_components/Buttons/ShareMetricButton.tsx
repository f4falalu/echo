import { Button } from 'antd';
import React from 'react';
import { AppMaterialIcons } from '@/components/icons';
import { ShareMenu } from '../ShareMenu';

export const ShareMetricButton = React.memo(() => {
  return <Button type="text" icon={<AppMaterialIcons icon="share_windows" />} />;
});

ShareMetricButton.displayName = 'ShareMetricButton';
