import type { BusterChatMessageRequest } from '@/api/asset_interfaces';
import React from 'react';
import { Paragraph } from '@/components/ui/typography';
import { MessageContainer } from './MessageContainer';

export const ChatUserMessage: React.FC<{ requestMessage: BusterChatMessageRequest }> = React.memo(
  ({ requestMessage }) => {
    if (!requestMessage) return null;

    const { sender_avatar, sender_id, sender_name, request } = requestMessage;

    return (
      <MessageContainer senderName={sender_name} senderId={sender_id} senderAvatar={sender_avatar}>
        <Paragraph className="text-sm">{request}</Paragraph>
      </MessageContainer>
    );
  }
);

ChatUserMessage.displayName = 'ChatUserMessage';
