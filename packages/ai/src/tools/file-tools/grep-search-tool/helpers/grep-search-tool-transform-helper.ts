import type { ChatMessageResponseMessage_Text } from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import type { GrepSearchToolState } from '../grep-search-tool';

export function createGrepSearchToolResponseMessage(
  grepSearchToolState: GrepSearchToolState,
  toolCallId?: string
): ChatMessageResponseMessage_Text | null {
  // Use entry_id from state or fallback to provided toolCallId
  const id = grepSearchToolState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  // Create a summary message based on the commands
  const commandsCount = grepSearchToolState.commands?.length || 0;
  const commandsText =
    commandsCount > 0
      ? `Executing ${commandsCount} ripgrep command${commandsCount === 1 ? '' : 's'}`
      : 'Preparing to execute ripgrep commands';

  return {
    id,
    type: 'text',
    message: commandsText,
    is_final_message: false,
  };
}

export function createGrepSearchToolRawLlmMessageEntry(
  grepSearchToolState: GrepSearchToolState,
  toolCallId?: string
): ModelMessage | null {
  const id = grepSearchToolState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  // Build the input for the tool call based on current state
  const input: Record<string, unknown> = {};
  if (grepSearchToolState.commands) {
    input.commands = grepSearchToolState.commands;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'grepSearchTool',
        input,
      },
    ],
  };
}
