import { useNavigate } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useHasLoadedChat } from '@/context/Chats/useGetChat';
import {
  useGetChatMessageCompleted,
  useGetChatMessageHasResponseFile,
  useGetChatMessageIsFinishedReasoning,
  useGetChatMessageLastReasoningMessageId,
} from '@/context/Chats/useGetChatMessage';
import { useWhyDidYouUpdate } from '@/hooks/useWhyDidYouUpdate';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

export const useAutoRedirectStreaming = ({
  lastMessageId,
  chatId,
}: {
  lastMessageId: string;
  chatId: string | undefined;
}) => {
  const navigate = useNavigate();
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const isStreamFinished = useGetChatMessageCompleted({ messageId: lastMessageId });
  const lastReasoningMessageId = useGetChatMessageLastReasoningMessageId({
    messageId: lastMessageId,
  });
  const isFinishedReasoning = useGetChatMessageIsFinishedReasoning({ messageId: lastMessageId });
  const hasResponseFile = useGetChatMessageHasResponseFile({ messageId: lastMessageId });

  const previousIsCompletedStream = useRef<boolean>(isStreamFinished);

  const hasLoadedChat = useHasLoadedChat({ chatId: chatId || '' });

  const hasReasoning = !!lastReasoningMessageId;

  useLayoutEffect(() => {
    previousIsCompletedStream.current = isStreamFinished;
  }, [hasLoadedChat]);

  useWhyDidYouUpdate('useAutoRedirectStreaming', {
    isStreamFinished,
    hasReasoning,
    hasResponseFile,
    chatId,
    lastMessageId,
    isFinishedReasoning,
  });

  //streaming logic to redirect
  useEffect(() => {
    if (!hasLoadedChat || !chatId || isStreamFinished) {
      return;
    }

    const chatMessage = getChatMessageMemoized(lastMessageId);
    const firstFileId = chatMessage?.response_message_ids?.find((id) => {
      const responseMessage = chatMessage?.response_messages[id];
      return responseMessage?.type === 'file';
    });

    //this will happen if it is streaming and has a file in the response
    if (!isStreamFinished && firstFileId) {
      const firstFile = chatMessage?.response_messages[firstFileId] as
        | BusterChatResponseMessage_file
        | undefined;

      if (firstFile) {
        const linkProps = assetParamsToRoute({
          assetId: firstFile.id,
          assetType: firstFile.file_type,
          chatId,
          versionNumber: firstFile.version_number,
        });
        console.log('this is navigated to the file', linkProps);

        navigate({ ...linkProps, replace: true });
      }
    }

    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    else if (!isStreamFinished && !isFinishedReasoning && hasReasoning && chatId) {
      console.log(
        'this will trigger when the chat is streaming and is has not completed yet (new chat)'
      );
      navigate({
        to: '/app/chats/$chatId/reasoning/$messageId',
        params: {
          chatId,
          messageId: lastMessageId,
        },
        replace: true,
      });
    }

    //this happen will when the chat is completed and it WAS streaming
    else if (isStreamFinished && previousIsCompletedStream.current === false && !firstFileId) {
      //no file is found, so we need to collapse the chat
      console.log('this will trigger when the chat is completed and it WAS streaming');

      navigate({
        to: '/app/chats/$chatId',
        params: {
          chatId,
        },
        replace: true,
      });
    }
  }, [isStreamFinished, hasReasoning, hasResponseFile, chatId, lastMessageId, isFinishedReasoning]); //only use these values to trigger the useEffect
};
