import { Text } from '@/components/ui/typography';
import { Avatar } from '@/components/ui/avatar';
import React from 'react';

export const ListUserItem = React.memo(({ name, email }: { name: string; email: string }) => {
  return (
    <div className="flex w-full items-center space-x-1.5">
      <div className="flex items-center space-x-2">
        <Avatar className="h-[18px] w-[18px]" name={name} />
      </div>

      <div className="flex flex-col space-y-0">
        <Text>{name}</Text>
        {email && (
          <Text variant="secondary" style={{ fontSize: 12 }}>
            {email}
          </Text>
        )}
      </div>
    </div>
  );
});
ListUserItem.displayName = 'ListUserItem';
