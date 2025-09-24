import type { ModelMessage } from 'ai';

export function extractUserAndDoneToolMessages(messages: ModelMessage[]): ModelMessage[] {
  return messages.filter((m) => {
    // Include user messages and done tool calls and results
    if (m.role === 'user' && typeof m.content === 'string') {
      return true;
    }

    // Include doneTool calls
    if (m.role === 'assistant' && Array.isArray(m.content)) {
      return m.content.some(
        (contentItem) => contentItem.type === 'tool-call' && contentItem.toolName === 'doneTool'
      );
    }

    // Include doneTool results
    if (m.role === 'tool' && Array.isArray(m.content)) {
      return m.content.some(
        (contentItem) => contentItem.type === 'tool-result' && contentItem.toolName === 'doneTool'
      );
    }

    return false;
  });
}
