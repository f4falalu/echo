'use client';

import React from 'react';
import { Title, Text } from '@/components/ui/typography';

export const PermissionTitleCard: React.FC<{}> = React.memo(({}) => {
  return (
    <div className="flex flex-col gap-1.5">
      <Title as="h3">Dataset Permissions</Title>
      <Text size={'lg'} variant="secondary">
        Manage who can build dashboards & metrics using this dataset
      </Text>
    </div>
  );
});

PermissionTitleCard.displayName = 'PermissionTitleCard';
