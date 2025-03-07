import React from 'react';
import { ASSET_ICONS } from '../config/assetIcons';
import { Button } from '@/components/ui/buttons';

export const CollectionButton: React.FC<{
  buttonType?: 'ghost' | 'default';
  useText?: boolean;
}> = ({ buttonType = 'default', useText = false }) => {
  return (
    <Button prefix={<ASSET_ICONS.collections />} variant={buttonType}>
      {useText ? 'Collections' : ''}
    </Button>
  );
};
