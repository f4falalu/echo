import { useNavigate } from '@tanstack/react-router';
import React, { useMemo } from 'react';
import {
  useDuplicateChat,
  useGetChatMessage,
  useUpdateChatMessageFeedback,
} from '@/api/buster_rest/chats';
import { MessageAssumptions } from '@/components/features/sheets/MessageAssumptions';
import { Button } from '@/components/ui/buttons';
import { DuplicatePlus, ThumbsDown } from '@/components/ui/icons';
import { ThumbsDown as ThumbsDownFilled } from '@/components/ui/icons/NucleoIconFilled';
import { AppTooltip } from '@/components/ui/tooltip';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { formatDate } from '@/lib/date';
import { timeout } from '@/lib/timeout';

export const ChatMessageOptions: React.FC<{
  messageId: string;
  chatId: string;
}> = React.memo(({ messageId, chatId }) => {
  const navigate = useNavigate();
  const { openConfirmModal } = useBusterNotifications();
  const { mutateAsync: duplicateChat, isPending: isCopying } = useDuplicateChat();
  const { mutateAsync: updateChatMessageFeedback } = useUpdateChatMessageFeedback();
  const { data: feedback } = useGetChatMessage(messageId, {
    select: ({ feedback }) => feedback,
  });
  const { data: updatedAt } = useGetChatMessage(messageId, {
    select: ({ updated_at }) => updated_at,
  });
  const { data: postProcessingMessage } = useGetChatMessage(messageId, {
    select: ({ post_processing_message }) => post_processing_message,
  });

  const updatedAtFormatted = useMemo(() => {
    if (!updatedAt) return '';
    return formatDate({
      date: updatedAt,
      format: 'lll',
    });
  }, [updatedAt]);

  const warnBeforeDuplicate = useMemoizedFn(() => {
    openConfirmModal({
      title: 'Duplicate chat',
      content:
        'You are about to duplicate this chat from this message. This will create a new chat with the same messages. Do you want to continue?',
      onOk: async () => {
        const res = await duplicateChat({
          id: chatId,
          message_id: messageId,
        });
        await timeout(100);
        await navigate({
          to: '/app/chats/$chatId',
          params: {
            chatId: res.id,
          },
        });
      },
    });
  });

  return (
    <div className="flex items-center gap-1">
      <AppTooltip title="Duplicate chat from this message">
        <Button
          variant="ghost"
          prefix={<DuplicatePlus />}
          loading={isCopying}
          onClick={warnBeforeDuplicate}
        />
      </AppTooltip>
      <AppTooltip title="Report message">
        <Button
          variant="ghost"
          prefix={feedback === 'negative' ? <ThumbsDownFilled /> : <ThumbsDown />}
          onClick={() =>
            updateChatMessageFeedback({
              message_id: messageId,
              feedback: feedback === 'negative' ? null : 'negative',
            })
          }
        />
      </AppTooltip>

      {postProcessingMessage && (
        <AppTooltip title="View assumptions">
          <MessageAssumptions {...postProcessingMessage} />
        </AppTooltip>
      )}

      <Text
        className="ml-auto opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        variant={'tertiary'}
        size={'sm'}
      >
        {updatedAtFormatted}
      </Text>
    </div>
  );
});

ChatMessageOptions.displayName = 'ChatMessageOptions';
