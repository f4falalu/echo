import type { ChatMessageResponseMessage_Text } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { DoneToolState } from '../done-tool';

export function createDoneToolResponseMessage(
  doneToolState: DoneToolState,
  toolCallId?: string
): ChatMessageResponseMessage_Text | null {
  // Use entry_id from state or fallback to provided toolCallId
  const id = doneToolState.toolCallId || toolCallId;

  if (!id) {
    return null;
  }

  return {
    id,
    type: 'text',
    message: doneToolState.finalResponse || '',
    is_final_message: true,
  };
}

export function createDoneToolRawLlmMessageEntry(
  doneToolState: DoneToolState,
  toolCallId?: string
): ModelMessage | undefined {
  const id = doneToolState.toolCallId || toolCallId;

  if (!id) {
    return undefined;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'doneTool',
        input: { finalResponse: doneToolState.finalResponse || '' },
      },
    ],
  };
}
