'use client';

import React from 'react';
import { AppContentHeader } from '../../../../components/ui/layouts/AppContentHeader';
import { Text } from '@/components/ui';

export const ChatListHeader: React.FC<{}> = ({}) => {
  return (
    <AppContentHeader>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center space-x-2">
          <Text>{'Chats'}</Text>
        </div>
      </div>
    </AppContentHeader>
  );
};
