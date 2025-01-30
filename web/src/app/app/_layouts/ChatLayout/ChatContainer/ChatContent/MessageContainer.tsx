import { BusterUserAvatar, BusterAvatar } from '@/components/image';
import { createStyles } from 'antd-style';
import React from 'react';

export const MessageContainer: React.FC<{
  children: React.ReactNode;
  senderName?: string;
  senderId?: string;
  senderAvatar?: string | null;
  className?: string;
}> = React.memo(({ children, senderName, senderId, senderAvatar, className = '' }) => {
  const { cx } = useStyles();
  return (
    <div className={cx('flex w-full space-x-1 overflow-hidden')}>
      {senderName ? (
        <BusterUserAvatar size={24} name={senderName} src={senderAvatar} useToolTip={true} />
      ) : (
        <BusterAvatar size={24} />
      )}
      <div className={cx(className, 'px-1')}>{children}</div>
    </div>
  );
});

MessageContainer.displayName = 'MessageContainer';

const useStyles = createStyles(({ token, css }) => ({}));
