import type { ElectricShapeOptions } from '../instances';
import type {
  BusterChatMessage,
  BusterChatMessageReasoning,
  BusterChatMessageResponse
} from '@/api/asset_interfaces/chat';

export type BusterChatMessageShape = {
  id: string;
  response_messages: string | BusterChatMessageResponse[];
  reasoning: string | BusterChatMessageReasoning[];
  created_at: BusterChatMessage['created_at'];
  final_reasoning_message: BusterChatMessage['final_reasoning_message'];
  feedback: BusterChatMessage['feedback'];
  is_completed: boolean;
};

const MESSAGE_DEFAULT_COLUMNS: (keyof BusterChatMessageShape)[] = [
  'id',
  'response_messages',
  'reasoning',
  'created_at',
  'final_reasoning_message',
  'feedback',
  'is_completed'
];

export const messageShape = ({
  chatId,
  messageId
}: {
  chatId: string;
  messageId: string;
}): ElectricShapeOptions<BusterChatMessageShape> => {
  return {
    params: {
      table: 'messages',
      where: `chat_id='${chatId}' AND id='${messageId}'`,
      columns: MESSAGE_DEFAULT_COLUMNS,
      replica: 'default'
    }
  };
};

export const messagesShape = ({
  chatId,
  columns = MESSAGE_DEFAULT_COLUMNS
}: {
  chatId: string;
  columns?: (keyof BusterChatMessageShape)[];
}): ElectricShapeOptions<BusterChatMessageShape> => {
  return {
    params: {
      table: 'messages',
      where: `chat_id='${chatId}'`,
      columns: columns || MESSAGE_DEFAULT_COLUMNS
    }
  };
};
