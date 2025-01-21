import React from 'react';
import { Text } from '@/components/text';

export const EmptyStateList = React.memo(({ text }: { text: string }) => {
  return (
    <div className="py-12">
      <Text type="secondary">{text}</Text>
    </div>
  );
});

EmptyStateList.displayName = 'EmptyStateList';
