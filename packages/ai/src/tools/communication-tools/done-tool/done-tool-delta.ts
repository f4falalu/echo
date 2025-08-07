import type { ToolCallOptions } from 'ai';
import type { DoneToolContext, DoneToolState } from './done-tool';

export function createDoneToolDelta<TAgentContext extends DoneToolContext>(
  doneToolState: DoneToolState,
  context: TAgentContext
) {
  return function doneToolDelta(options: { inputTextDelta: string } & ToolCallOptions): void {};
}
