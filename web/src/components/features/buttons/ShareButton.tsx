import { Button } from '@/components/ui/buttons';
import { ShareRight3 } from '@/components/ui/icons';
import React from 'react';

export const ShareButton = React.memo(() => {
  return <Button variant="ghost" prefix={<ShareRight3 />} />;
});

ShareButton.displayName = 'ShareButton';
