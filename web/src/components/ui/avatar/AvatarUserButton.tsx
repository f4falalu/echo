import React from 'react';
import { Avatar } from './Avatar';
import { Text } from '../typography/Text';
import { ChevronExpandY } from '../icons';

export const AvatarUserButton = React.forwardRef<
  HTMLDivElement,
  {
    username?: string;
    avatarUrl?: string;
    email?: string;
  }
>(({ username, avatarUrl, email }, ref) => {
  return (
    <div
      ref={ref}
      className="hover:bg-item-hover active:bg-item-active flex w-full cursor-pointer items-center gap-x-2 rounded-md p-2">
      <Avatar size={32} fallbackClassName="text-base" image={avatarUrl} name={username} />
      <div className="flex flex-col gap-y-0.5">
        <Text className="flex-grow">{username}</Text>
        <Text size={'sm'} variant={'secondary'}>
          {email}
        </Text>
      </div>
      <div className="ml-auto">
        <ChevronExpandY />
      </div>
    </div>
  );
});

AvatarUserButton.displayName = 'AvatarUserButton';
