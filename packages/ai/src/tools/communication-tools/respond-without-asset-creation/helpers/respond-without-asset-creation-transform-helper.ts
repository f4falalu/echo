import type { ChatMessageResponseMessage_Text } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { RespondWithoutAssetCreationState } from '../respond-without-asset-creation-tool';

export function createRespondWithoutAssetCreationResponseMessage(
  state: RespondWithoutAssetCreationState,
  toolCallId?: string
): ChatMessageResponseMessage_Text | null {
  // Use entry_id from state or fallback to provided toolCallId
  const id = state.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  return {
    id,
    type: 'text',
    message: state.final_response || '',
    is_final_message: true,
  };
}

export function createRespondWithoutAssetCreationRawLlmMessageEntry(
  state: RespondWithoutAssetCreationState,
  toolCallId?: string
): ModelMessage | null {
  const id = state.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'respondWithoutAssetCreation',
        input: {
          final_response: state.final_response || '',
        },
      },
    ],
  };
}
