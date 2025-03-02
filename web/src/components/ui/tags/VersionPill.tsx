import { Text } from '@/components/ui/typography';
import React from 'react';
import { cn } from '@/lib/classMerge';

export const VersionPill: React.FC<{ version_number: number }> = React.memo(
  ({ version_number = 1 }) => {
    const text = `v${version_number}`;

    return (
      <div
        className={cn(
          'bg-item-hover rounded border px-1',
          'h-[18px] w-fit min-w-[18px]',
          'flex items-center justify-center'
        )}>
        <Text variant="secondary" size="sm">
          {text}
        </Text>
      </div>
    );
  }
);

VersionPill.displayName = 'VersionPill';
