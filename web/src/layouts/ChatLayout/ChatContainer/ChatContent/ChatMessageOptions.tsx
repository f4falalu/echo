import React from 'react';
import { Button } from '@/components/ui/buttons';
import { AppTooltip } from '@/components/ui/tooltip';
import { Copy, ThumbsDown } from '@/components/ui/icons';
import { ThumbsDown as ThumbsDownFilled } from '@/components/ui/icons/NucleoIconFilled';
import {
  useDuplicateChat,
  useGetChatMessage,
  useUpdateChatMessageFeedback
} from '@/api/buster_rest/chats';

export const ChatMessageOptions: React.FC<{
  messageId: string;
  chatId: string;
}> = React.memo(({ messageId, chatId }) => {
  const { mutateAsync: duplicateChat, isPending: isCopying } = useDuplicateChat();
  const { mutateAsync: updateChatMessageFeedback } = useUpdateChatMessageFeedback();
  const { data: feedback } = useGetChatMessage(messageId, {
    select: ({ feedback }) => feedback
  });

  return (
    <div className="flex items-center gap-1">
      <AppTooltip title="Duplicate message">
        <Button
          variant="ghost"
          prefix={<Copy />}
          loading={isCopying}
          onClick={() =>
            duplicateChat({
              id: chatId,
              message_id: messageId
            })
          }
        />
      </AppTooltip>
      <AppTooltip title="Report message">
        <Button
          variant="ghost"
          prefix={feedback === 'negative' ? <ThumbsDownFilled /> : <ThumbsDown />}
          onClick={() =>
            updateChatMessageFeedback({
              message_id: messageId,
              feedback: feedback === 'negative' ? null : 'negative'
            })
          }
        />
      </AppTooltip>
    </div>
  );
});

ChatMessageOptions.displayName = 'ChatMessageOptions';
