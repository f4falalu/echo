import { wrapTraced } from 'braintrust';
import type { DoneToolContext, DoneToolInput, DoneToolOutput } from './done-tool';

// Process done tool execution with todo management
async function processDone(): Promise<DoneToolOutput> {
  return {
    success: true,
  };
}

// Factory function that creates the execute function with proper context typing
export function createDoneToolExecute() {
  return wrapTraced(
    async (_input: DoneToolInput): Promise<DoneToolOutput> => {
      return processDone();
    },
    { name: 'Done Tool' }
  );
}
