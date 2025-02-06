import { AppMaterialIcons } from '@/components';
import { Button } from 'antd';
import React from 'react';

export const CollectionButton: React.FC<{
  buttonType?: 'text' | 'default';
  useText?: boolean;
}> = ({ buttonType = 'text', useText = false }) => {
  return (
    <Button icon={<AppMaterialIcons icon="note_stack_add" />} type={buttonType}>
      {useText ? 'Collections' : ''}
    </Button>
  );
};
