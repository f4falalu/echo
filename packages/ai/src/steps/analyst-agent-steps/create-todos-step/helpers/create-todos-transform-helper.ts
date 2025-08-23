import type {
  ChatMessageReasoningMessage_File,
  ChatMessageReasoningMessage_Files,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
import { formatElapsedTime } from '../../../../tools/shared/format-elapsed-time';
import type { CreateTodosState } from '../create-todos-step';

/**
 * Creates a reasoning message for TODOs to display in the reasoning UI
 * This treats the entire TODO list as a single file with file_name 'TODOS'
 */
export function createTodosReasoningMessage(
  todosState: CreateTodosState,
  toolCallId?: string
): ChatMessageReasoningMessage_Files | null {
  const id = todosState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  const todoFile: ChatMessageReasoningMessage_File = {
    id,
    file_type: 'todo',
    file_name: 'TODOS',
    status: todosState.is_complete ? 'completed' : 'loading',
    file: {
      text: todosState.todos || '',
      modified: undefined,
    },
  };

  // Calculate elapsed time if complete
  const secondaryTitle = todosState.is_complete
    ? formatElapsedTime(todosState.startTime)
    : undefined;

  return {
    id,
    type: 'files',
    title: todosState.is_complete ? 'Broke down your request' : 'Breaking down your request...',
    status: todosState.is_complete ? 'completed' : 'loading',
    secondary_title: secondaryTitle,
    file_ids: [id],
    files: {
      [id]: todoFile,
    },
  };
}

/**
 * Creates raw LLM message entries for TODOs as tool call and result
 * This is stored as tool messages in the database to preserve the original user message
 */
export function createTodosRawLlmMessageEntry(
  todosState: CreateTodosState,
  toolCallId?: string
): ModelMessage[] | null {
  const id = todosState.entry_id || toolCallId;

  if (!id || !todosState.todos) {
    return null;
  }

  const messages: ModelMessage[] = [];

  // Add assistant message with tool call
  messages.push({
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'createTodos',
        input: {},
      },
    ],
  });

  // Add tool result message
  messages.push({
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: id,
        toolName: 'createTodos',
        output: {
          type: 'text',
          value: todosState.todos,
        },
      },
    ],
  });

  return messages;
}

/**
 * Creates a user message with TODOs for the conversation history
 * This is used to inject TODOs into the message flow
 */
export function createTodosUserMessage(todos: string): ModelMessage {
  return {
    role: 'user',
    content: `<todo_list>
- Below are the items on your TODO list:
${todos}
</todo_list>`,
  };
}
