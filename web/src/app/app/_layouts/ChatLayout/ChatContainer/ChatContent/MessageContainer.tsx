import { BusterUserAvatar, BusterAvatar } from '@/components/image';
import { createStyles } from 'antd-style';
import React from 'react';

export const MessageContainer: React.FC<{
  children: React.ReactNode;
  senderName?: string;
  senderId?: string;
  senderAvatar?: string | null;
}> = React.memo(({ children, senderName, senderId, senderAvatar }) => {
  const { styles, cx } = useStyles();
  return (
    <div className={cx('flex space-x-2')}>
      {senderName ? (
        <BusterUserAvatar size={24} name={senderName} src={senderAvatar} useToolTip={true} />
      ) : (
        <BusterAvatar size={24} />
      )}
      <div>{children}</div>
    </div>
  );
});

MessageContainer.displayName = 'MessageContainer';

const useStyles = createStyles(({ token, css }) => ({}));
