import type { ModelMessage } from 'ai';

export function createRawToolResultEntry<T>(
  toolCallId: string,
  toolName: string,
  output: T
): ModelMessage {
  return {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId,
        toolName,
        output: {
          type: 'json',
          value: JSON.stringify(output),
        },
      },
    ],
  };
}
