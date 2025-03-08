'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { queryKeys } from '@/api/query_keys';
import { BarContainer } from './BarContainer';

export const BlackBoxMessage: React.FC<{ messageId: string }> = React.memo(({ messageId }) => {
  const blackBoxMessage = useQuery({
    ...queryKeys.chatsBlackBoxMessages(messageId),
    notifyOnChangeProps: ['data']
  }).data;

  if (blackBoxMessage) {
    return (
      <BarContainer
        showBar={false}
        status={'loading'}
        isCompletedStream={false}
        title={blackBoxMessage}
        secondaryTitle={''}
      />
    );
  }

  return null;
});

BlackBoxMessage.displayName = 'BlackBoxMessage';
