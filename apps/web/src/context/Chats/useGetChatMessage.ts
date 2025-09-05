import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';

const stableIsCompleted = (x: BusterChatMessage) => x?.is_completed;
export const useGetChatMessageCompleted = ({ messageId }: { messageId: string }) => {
  const { data: isStreamFinished = false } = useGetChatMessage(messageId, {
    select: stableIsCompleted,
    notifyOnChangeProps: ['data'],
  });

  return isStreamFinished;
};

const stableLastReasoningMessageId = (x: BusterChatMessage) =>
  x?.reasoning_message_ids?.[x?.reasoning_message_ids?.length - 1];
export const useGetChatMessageLastReasoningMessageId = ({ messageId }: { messageId: string }) => {
  const { data: lastReasoningMessageId } = useGetChatMessage(messageId, {
    select: stableLastReasoningMessageId,
    notifyOnChangeProps: ['data'],
  });

  return lastReasoningMessageId;
};

const stableIsFinishedReasoning = (x: BusterChatMessage) =>
  !!(x?.is_completed || !!x.final_reasoning_message);
export const useGetChatMessageIsFinishedReasoning = ({ messageId }: { messageId: string }) => {
  const { data: isFinishedReasoning } = useGetChatMessage(messageId, {
    select: stableIsFinishedReasoning,
    notifyOnChangeProps: ['data'],
  });

  return isFinishedReasoning;
};

const stableHasResponseFile = (x: BusterChatMessage) =>
  Object.values(x?.response_messages || {}).some((x) => x.type === 'file');
export const useGetChatMessageHasResponseFile = ({ messageId }: { messageId: string }) => {
  const { data: hasResponseFile } = useGetChatMessage(messageId, {
    select: stableHasResponseFile,
    notifyOnChangeProps: ['data'],
  });

  return hasResponseFile;
};
