import type { ToolCallOptions } from 'ai';
import type { DoneToolAgentContext } from './done-tool';

// Factory function that creates a type-safe callback for the specific agent context
export function createDoneToolStart<TAgentContext extends DoneToolAgentContext>() {
  return function doneToolStart(options: ToolCallOptions): void {
    // Extract messageId from the agent context
    const agentContext = options.experimental_context as TAgentContext | undefined;
    console.info('Done tool started', {
      toolCallId: options.toolCallId,
      messageId: agentContext?.messageId,
    });
  };
}
