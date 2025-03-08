import type { BusterChat, BusterChatMessage } from '@/api/asset_interfaces/chat';
import type { IBusterChat, IBusterChatMessage } from '@/api/asset_interfaces/chat';
import { create } from 'mutative';
import omit from 'lodash/omit';
import { BusterMetric, IBusterMetric } from '@/api/asset_interfaces/metric';
import { createDefaultChartConfig } from './messageAutoChartHandler';

const chatUpgrader = (chat: BusterChat, { isNewChat }: { isNewChat: boolean }): IBusterChat => {
  return {
    ...omit(chat, 'messages'),
    isNewChat
  };
};

const chatMessageUpgrader = (
  messageIds: string[],
  message: Record<string, BusterChatMessage>,
  streamingMessageId?: string
): Record<string, IBusterChatMessage> => {
  return messageIds.reduce(
    (acc, messageId) => {
      acc[messageId] = create(message[messageId] as IBusterChatMessage, (draft) => {
        draft.isCompletedStream = streamingMessageId === messageId;
      });
      return acc;
    },
    {} as Record<string, IBusterChatMessage>
  );
};

export const updateChatToIChat = (
  chat: BusterChat,
  isNewChat: boolean
): { iChat: IBusterChat; iChatMessages: Record<string, IBusterChatMessage> } => {
  const iChat = chatUpgrader(chat, { isNewChat });
  const iChatMessages = chatMessageUpgrader(
    chat.message_ids,
    chat.messages,
    isNewChat ? chat.message_ids[0] : undefined
  );
  return {
    iChat,
    iChatMessages
  };
};

export const upgradeMetricToIMetric = (
  metric: BusterMetric,
  oldMetric: IBusterMetric | null | undefined
): IBusterMetric => {
  const chart_config = createDefaultChartConfig(metric);
  return {
    ...oldMetric,
    ...metric,
    chart_config,
    fetched: true,
    fetching: false,
    fetchedAt: Date.now()
  };
};
