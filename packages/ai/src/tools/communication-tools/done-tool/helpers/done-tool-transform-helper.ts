import type { ChatMessageResponseMessage_Text } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { DoneToolState } from '../done-tool';

export function createDoneToolResponseMessage(
  doneToolState: DoneToolState,
  toolCallId?: string
): ChatMessageResponseMessage_Text | null {
  // Use entry_id from state or fallback to provided toolCallId
  const id = doneToolState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  return {
    id,
    type: 'text',
    message: doneToolState.final_response || '',
    is_final_message: true,
  };
}

export function createDoneToolRawLlmMessageEntry(
  doneToolState: DoneToolState,
  toolCallId?: string
): ModelMessage | null {
  const id = doneToolState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'doneTool',
        input: {},
      },
      // Optionally include any accumulated text content
      ...(doneToolState.final_response
        ? [{ type: 'text' as const, text: doneToolState.final_response }]
        : []),
    ],
  };
}
