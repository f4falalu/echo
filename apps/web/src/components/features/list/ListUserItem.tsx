import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/typography';

export const ListUserItem = React.memo(
  ({ name, email, avatarURL }: { name: string; email: string; avatarURL: string | null }) => {
    return (
      <div className="flex w-full items-center space-x-2">
        <div className="flex items-center">
          <Avatar size={24} name={name} image={avatarURL} />
        </div>

        <div className="flex flex-col justify-center space-y-0">
          {name && <Text>{name}</Text>}
          {email && (
            <Text variant="secondary" style={{ fontSize: 12 }}>
              {email}
            </Text>
          )}
        </div>
      </div>
    );
  }
);
ListUserItem.displayName = 'ListUserItem';
