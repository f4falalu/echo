import type { ToolCallOptions } from 'ai';
import { wrapTraced } from 'braintrust';
import type { DoneToolAgentContext, DoneToolInput, DoneToolOutput } from './done-tool';

// Process done tool execution with todo management
async function processDone(_input: DoneToolInput, messageId?: string): Promise<DoneToolOutput> {
  if (messageId) {
    console.info('Processing done with messageId:', messageId);
  }
  return {
    success: true,
  };
}

// Factory function that creates the execute function with proper context typing
export function createDoneToolExecute<TAgentContext extends DoneToolAgentContext>() {
  return wrapTraced(
    async (input: DoneToolInput, options: ToolCallOptions): Promise<DoneToolOutput> => {
      // Extract only the messageId from the agent context
      const agentContext = options.experimental_context as TAgentContext | undefined;
      const messageId = agentContext?.messageId;
      return await processDone(input, messageId);
    },
    { name: 'Done Tool' }
  );
}