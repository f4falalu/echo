import { wrapTraced } from 'braintrust';
import type { DoneToolContext, DoneToolInput, DoneToolOutput } from './done-tool';

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
export function createDoneToolExecute<TAgentContext extends DoneToolContext>(
  context: TAgentContext
) {
  return wrapTraced(
    async (input: DoneToolInput): Promise<DoneToolOutput> => {
      // Use the messageId from the passed context
      const messageId = context.messageId;
      return await processDone(input, messageId);
    },
    { name: 'Done Tool' }
  );
}
