import type { ModelMessage, ToolModelMessage, ToolResultPart } from 'ai';
import type { NoSuchToolError } from 'ai';

/**
 * Creates a healing message for NoSuchToolError that simulates a tool error result.
 * This allows the LLM to understand which tool failed and what tools are available.
 *
 * @param error - The NoSuchToolError that was caught
 * @param availableTools - A comma-separated string of available tool names
 * @returns A ModelMessage with a tool error result
 */
export function createNoSuchToolHealingMessage(
  error: NoSuchToolError,
  healingMessage: string
): ModelMessage {
  return {
    role: 'tool',
    content: [
      {
        type: 'tool-result',
        toolCallId: error.toolCallId,
        toolName: error.toolName,
        output: {
          type: 'text',
          value: `Tool "${error.toolName}" is not available. ${healingMessage}.`,
        },
      },
    ],
  };
}
