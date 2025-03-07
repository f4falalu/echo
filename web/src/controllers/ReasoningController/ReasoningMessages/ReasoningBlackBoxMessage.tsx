'use client';

import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { queryKeys } from '@/api/query_keys';
import { BarContainer } from './BarContainer';
import { Text } from '@/components/ui/typography';

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

  return <span className="text-red-500">no black box {messageId}</span>;
});

BlackBoxMessage.displayName = 'BlackBoxMessage';
