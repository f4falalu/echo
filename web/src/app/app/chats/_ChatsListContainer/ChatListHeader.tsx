'use client';

import React from 'react';
import { AppContentHeader } from '../../../../components/layout/AppContentHeader';
import { Text } from '@/components/text';

export const ChatListHeader: React.FC<{}> = ({}) => {
  const showFilters: boolean = true;

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
