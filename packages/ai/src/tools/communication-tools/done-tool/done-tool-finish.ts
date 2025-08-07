import type { ToolCallOptions } from 'ai';
import type { DoneToolContext, DoneToolInput, DoneToolState } from './done-tool';

export function createDoneToolFinish<TAgentContext extends DoneToolContext>(
  doneToolState: DoneToolState,
  context: TAgentContext
) {
  return function doneToolFinish(options: { input: DoneToolInput } & ToolCallOptions): void {
    console.info('Done tool input available', {
      toolCallId: options.toolCallId,
      finalResponse: `${options.input.final_response.substring(0, 100)}...`, // Log first 100 chars
      messageId: context.messageId,
    });
  };
}
