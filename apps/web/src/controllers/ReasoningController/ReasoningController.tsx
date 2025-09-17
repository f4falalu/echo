import { useQuery } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { BusterChatMessage, IBusterChat } from '@/api/asset_interfaces/chat';
import { useGetChat, useGetChatMessage } from '@/api/buster_rest/chats';
import { ScrollToBottomButton } from '@/components/features/buttons/ScrollToBottomButton';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetBlackBoxMessage } from '@/context/BlackBox/blackbox-store';
import {
  useGetChatMessageCompleted,
  useGetChatMessageFinalReasoningMessage,
  useGetChatMessageReasoningMessageIds,
} from '@/context/Chats/useGetChatMessage';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { cn } from '@/lib/utils';
import { ReasoningMessageSelector } from './ReasoningMessages';
import { BlackBoxMessage } from './ReasoningMessages/ReasoningBlackBoxMessage';

interface ReasoningControllerProps {
  chatId: string;
  messageId: string;
}

const stableHasChatSelector = (x: IBusterChat) => !!x.id;

export const ReasoningController: React.FC<ReasoningControllerProps> = ({ chatId, messageId }) => {
  const { data: hasChat } = useGetChat({ id: chatId || '' }, { select: stableHasChatSelector });
  const reasoning_message_ids = useGetChatMessageReasoningMessageIds({ messageId });
  const reasoningMessageIds = useMemo(() => reasoning_message_ids, [reasoning_message_ids]);
  const isStreamFinished = useGetChatMessageCompleted({ messageId });
  const finalReasoningMessage = useGetChatMessageFinalReasoningMessage({ messageId });

  const blackBoxMessage = useGetBlackBoxMessage(messageId);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const { isAutoScrollEnabled, isMountedAutoScrollObserver, scrollToBottom, enableAutoScroll } =
    useAutoScroll(viewportRef, {
      observeSubTree: true,
      enabled: !isStreamFinished,
    });

  useEffect(() => {
    if (hasChat && reasoningMessageIds) {
      enableAutoScroll();
    }
  }, [hasChat, isEmpty(reasoningMessageIds)]);

  if (!hasChat || !reasoningMessageIds) return <FileIndeterminateLoader />;

  return (
    <ClientOnly>
      <div
        className={cn(
          'h-full flex-col space-y-0.5 p-5',
          !isMountedAutoScrollObserver && 'invisible'
        )}
      >
        {reasoningMessageIds?.map((reasoningMessageId, messageIndex) => (
          <ReasoningMessageSelector
            key={reasoningMessageId}
            reasoningMessageId={reasoningMessageId}
            isStreamFinished={isStreamFinished ?? true}
            chatId={chatId}
            messageId={messageId}
            isLastMessage={messageIndex === reasoningMessageIds.length - 1 && !blackBoxMessage}
          />
        ))}

        <BlackBoxMessage
          blackBoxMessage={blackBoxMessage}
          finalReasoningMessage={finalReasoningMessage}
          isStreamFinished={isStreamFinished ?? true}
        />
      </div>

      {viewportRef.current && (
        <ScrollToBottomButton
          isAutoScrollEnabled={isAutoScrollEnabled}
          scrollToBottom={scrollToBottom}
        />
      )}
    </ClientOnly>
  );
};
