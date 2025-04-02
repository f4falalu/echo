import React from 'react';
import { Button } from '@/components/ui/buttons';
import { AppTooltip } from '@/components/ui/tooltip';
import { Copy, ThumbsDown } from '@/components/ui/icons';
import { ThumbsDown as ThumbsDownFilled } from '@/components/ui/icons/NucleoIconFilled';
import { useDuplicateChat, useGetChat, useUpdateChat } from '@/api/buster_rest/chats';

export const ChatMessageOptions: React.FC<{
  messageId: string;
  chatId: string;
}> = React.memo(({ messageId, chatId }) => {
  const { mutateAsync: duplicateChat, isPending: isCopying } = useDuplicateChat();
  const { mutateAsync: updateChat } = useUpdateChat();
  const { data: feedback } = useGetChat({ id: chatId }, (data) => data.feedback);

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
            updateChat({
              id: chatId,
              feedback: feedback === 'negative' ? null : 'negative'
            })
          }
        />
      </AppTooltip>
    </div>
  );
});

ChatMessageOptions.displayName = 'ChatMessageOptions';
