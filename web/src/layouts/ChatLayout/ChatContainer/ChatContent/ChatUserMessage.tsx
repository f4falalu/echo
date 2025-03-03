import type { BusterChatMessageRequest } from '@/api/asset_interfaces';
import { createStyles } from 'antd-style';
import React from 'react';
import { Text } from '@/components/ui';
import { MessageContainer } from './MessageContainer';

export const ChatUserMessage: React.FC<{ requestMessage: BusterChatMessageRequest }> = React.memo(
  ({ requestMessage }) => {
    if (!requestMessage) return null;

    const { sender_avatar, sender_id, sender_name, request } = requestMessage;

    return (
      <MessageContainer senderName={sender_name} senderId={sender_id} senderAvatar={sender_avatar}>
        <Text className="" lineHeight={undefined}>
          {request}
        </Text>
      </MessageContainer>
    );
  }
);

ChatUserMessage.displayName = 'ChatUserMessage';

const useStyles = createStyles(({ token, css }) => ({}));
