import type { ToolCallOptions } from 'ai';
import type { DoneToolAgentContext } from './done-tool';

export function createDoneToolDelta<TAgentContext extends DoneToolAgentContext>() {
  return function doneToolDelta(options: { inputTextDelta: string } & ToolCallOptions): void {
    const agentContext = options.experimental_context as TAgentContext | undefined;
    console.info('Done tool delta', {
      toolCallId: options.toolCallId,
      deltaLength: options.inputTextDelta.length,
      messageId: agentContext?.messageId,
    });
  };
}
