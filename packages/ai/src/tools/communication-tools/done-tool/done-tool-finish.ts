import type { ToolCallOptions } from 'ai';
import type { DoneToolAgentContext, DoneToolInput } from './done-tool';

export function createDoneToolFinish<TAgentContext extends DoneToolAgentContext>() {
  return function doneToolFinish(options: { input: DoneToolInput } & ToolCallOptions): void {
    const agentContext = options.experimental_context as TAgentContext | undefined;
    console.info('Done tool input available', {
      toolCallId: options.toolCallId,
      finalResponse: `${options.input.final_response.substring(0, 100)}...`, // Log first 100 chars
      messageId: agentContext?.messageId,
    });
  };
}
