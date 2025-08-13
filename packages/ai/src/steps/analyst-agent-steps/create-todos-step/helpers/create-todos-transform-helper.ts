import type {
  ChatMessageReasoningMessage_File,
  ChatMessageReasoningMessage_Files,
} from '@buster/server-shared/chats';
import type { ModelMessage } from 'ai';
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

  return {
    id,
    type: 'files',
    title: todosState.is_complete ? 'Broke down your request' : 'Breaking down your request...',
    status: todosState.is_complete ? 'completed' : 'loading',
    secondary_title: undefined,
    file_ids: [id],
    files: {
      [id]: todoFile,
    },
  };
}

/**
 * Creates a raw LLM message entry for TODOs
 * This is stored as the raw assistant message in the database
 */
export function createTodosRawLlmMessageEntry(
  todosState: CreateTodosState,
  toolCallId?: string
): ModelMessage | null {
  const id = todosState.entry_id || toolCallId;

  if (!id) {
    return null;
  }

  return {
    role: 'assistant',
    content: [
      {
        type: 'tool-call',
        toolCallId: id,
        toolName: 'createTodos',
        input: {
          todos: todosState.todos || '',
        },
      },
    ],
  };
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
