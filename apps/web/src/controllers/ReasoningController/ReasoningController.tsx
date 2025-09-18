import type React from 'react';
import { useEffect, useMemo, useRef } from 'react';
import type { IBusterChat } from '@/api/asset_interfaces/chat';
import { useGetChat } from '@/api/buster_rest/chats';
import { ScrollToBottomButton } from '@/components/features/buttons/ScrollToBottomButton';
import { FileIndeterminateLoader } from '@/components/features/loaders/FileIndeterminateLoader';
import { useGetScrollAreaRef } from '@/components/ui/scroll-area/useGetScrollAreaRef';
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
  const showReasoningController = !!hasChat && !!reasoningMessageIds?.length;

  const nodeRef = useRef<HTMLDivElement | null>(null);
  const { scrollAreaRef, foundScrollArea } = useGetScrollAreaRef({
    nodeRef,
    enabled: showReasoningController,
  });

  const { isAutoScrollEnabled, isMountedAutoScrollObserver, scrollToBottom, enableAutoScroll } =
    useAutoScroll(scrollAreaRef, {
      observeSubTree: true,
      enabled: !isStreamFinished,
    });

  useEffect(() => {
    if (showReasoningController && foundScrollArea) {
      enableAutoScroll();
    }
  }, [showReasoningController, foundScrollArea]);

  return (
    <>
      {!showReasoningController && <FileIndeterminateLoader ref={nodeRef} />}
      <div
        ref={nodeRef}
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

        {showReasoningController && (
          <BlackBoxMessage
            blackBoxMessage={blackBoxMessage}
            finalReasoningMessage={finalReasoningMessage}
            isStreamFinished={isStreamFinished ?? true}
          />
        )}
      </div>

      {scrollAreaRef.current && showReasoningController && (
        <ScrollToBottomButton
          isAutoScrollEnabled={isAutoScrollEnabled}
          scrollToBottom={scrollToBottom}
        />
      )}
    </>
  );
};
