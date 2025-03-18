import { Button } from '@/components/ui/buttons';
import { ShareRight, ShareRight3 } from '@/components/ui/icons';
import React from 'react';

export const ShareButton = React.memo(() => {
  return <Button variant="ghost" prefix={<ShareRight />} />;
});

ShareButton.displayName = 'ShareButton';
