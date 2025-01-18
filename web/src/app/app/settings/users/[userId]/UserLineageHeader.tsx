import React from 'react';
import { Text, Title } from '@/components/text';

export const UserLineageHeader = React.memo(({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <Title level={4}>{`Dataset access & lineage`}</Title>
      <Text type="secondary">{`View Blake Rouse’s access to all available datasets. Lineage is provided to show where access originates from.`}</Text>
    </div>
  );
});

UserLineageHeader.displayName = 'UserLineageHeader';
