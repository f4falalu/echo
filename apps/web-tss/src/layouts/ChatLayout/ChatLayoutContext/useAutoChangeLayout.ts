import { useNavigate } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useRef } from 'react';
import type { BusterChatResponseMessage_file } from '@/api/asset_interfaces/chat';
import { useGetChat, useGetChatMessage, useGetChatMessageMemoized } from '@/api/buster_rest/chats';
import { useGetCurrentMessageId } from '@/context/Chats';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';

export const useAutoChangeLayout = ({
  lastMessageId,
  chatId,
}: {
  lastMessageId: string;
  chatId: string | undefined;
}) => {
  const getChatMessageMemoized = useGetChatMessageMemoized();
  const messageId = useGetCurrentMessageId();
  const { data: isStreamFinished = false } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.is_completed,
  });
  const { data: lastReasoningMessageId } = useGetChatMessage(lastMessageId, {
    select: (x) => x?.reasoning_message_ids?.[x?.reasoning_message_ids?.length - 1],
  });
  const { data: isFinishedReasoning } = useGetChatMessage(lastMessageId, {
    select: (x) => !!lastReasoningMessageId && !!(x?.is_completed || !!x.final_reasoning_message),
  });
  const { data: hasResponseFile } = useGetChatMessage(lastMessageId, {
    select: (x) => Object.values(x?.response_messages || {}).some((x) => x.type === 'file'),
  });
  const navigate = useNavigate();

  const previousLastMessageId = useRef<string | null>(null);
  const previousIsCompletedStream = useRef<boolean>(isStreamFinished);

  const { data: hasLoadedChat } = useGetChat({ id: chatId || '' }, { select: (x) => !!x.id });

  const hasReasoning = !!lastReasoningMessageId;

  useLayoutEffect(() => {
    previousIsCompletedStream.current = isStreamFinished;
  }, [hasLoadedChat]);

  useEffect(() => {
    if (!hasLoadedChat || !chatId) {
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

        navigate(linkProps);
      }
    }

    //this will trigger when the chat is streaming and is has not completed yet (new chat)
    else if (!isStreamFinished && !isFinishedReasoning && hasReasoning && chatId) {
      previousLastMessageId.current = lastMessageId;

      if (!messageId) {
        navigate({
          to: '/app/chats/$chatId/reasoning/$messageId',
          params: {
            chatId,
            messageId: lastMessageId,
          },
          replace: true,
        });
      }
    }

    //this happen will when the chat is completed and it WAS streaming
    else if (isStreamFinished && previousIsCompletedStream.current === false && !firstFileId) {
      //no file is found, so we need to collapse the chat
      navigate({
        to: '/app/chats/$chatId',
        params: {
          chatId,
        },
        replace: true,
      });
    }
  }, [isStreamFinished, hasReasoning, hasResponseFile, chatId, lastMessageId]); //only use these values to trigger the useEffect
};
