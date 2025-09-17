import type { BusterChatMessage } from '@/api/asset_interfaces/chat';
import { useGetChatMessage } from '@/api/buster_rest/chats';

const stableIsCompleted = (x: BusterChatMessage) => x?.is_completed;
export const useGetChatMessageCompleted = ({ messageId }: { messageId: string }) => {
  const { data: isStreamFinished = true } = useGetChatMessage(messageId, {
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

const stableResponseMessageIds: BusterChatMessage['response_message_ids'] = [];
const useGetRepsonseMessageIds = (x: BusterChatMessage): string[] =>
  x?.response_message_ids || stableResponseMessageIds;
export const useGetChatMessageResponseMessageIds = ({ messageId }: { messageId: string }) => {
  const { data: responseMessageIds } = useGetChatMessage(messageId, {
    select: useGetRepsonseMessageIds,
    notifyOnChangeProps: ['data'],
  });
  return responseMessageIds;
};

const stableFinalReasoningMessage: (
  x: BusterChatMessage
) => BusterChatMessage['final_reasoning_message'] = (x) => x?.final_reasoning_message;
export const useGetChatMessageFinalReasoningMessage = ({ messageId }: { messageId: string }) => {
  const { data: finalReasoningMessage } = useGetChatMessage(messageId, {
    select: stableFinalReasoningMessage,
    notifyOnChangeProps: ['data'],
  });
  return finalReasoningMessage;
};

const stableReasoningMessageIds: BusterChatMessage['reasoning_message_ids'] = [];
const stableReasoningMessageIdsSelector = (x: BusterChatMessage) =>
  x?.reasoning_message_ids || stableReasoningMessageIds;
export const useGetChatMessageReasoningMessageIds = ({ messageId }: { messageId: string }) => {
  const { data: reasoningMessageIds } = useGetChatMessage(messageId, {
    select: stableReasoningMessageIdsSelector,
    notifyOnChangeProps: ['data'],
  });
  return reasoningMessageIds;
};
