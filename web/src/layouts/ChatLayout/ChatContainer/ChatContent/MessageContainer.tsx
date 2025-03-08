import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/classMerge';
import React from 'react';

export const MessageContainer: React.FC<{
  children: React.ReactNode;
  senderName?: string;
  senderId?: string;
  senderAvatar?: string | null;
  className?: string;
}> = React.memo(({ children, senderName, senderId, senderAvatar, className = '' }) => {
  return (
    <div className={'flex w-full space-x-2 overflow-hidden'}>
      {senderName ? (
        <Avatar size={24} name={senderName} image={senderAvatar || ''} useToolTip={true} />
      ) : (
        <Avatar size={24} />
      )}
      <div className={cn('mt-1 px-1', className)}>{children}</div>
    </div>
  );
});

MessageContainer.displayName = 'MessageContainer';
