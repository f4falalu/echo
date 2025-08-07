import { wrapTraced } from 'braintrust';
import type {
  SequentialThinkingContext,
  SequentialThinkingInput,
  SequentialThinkingOutput,
} from './sequential-thinking-tool';

// Process sequential thinking execution
async function processSequentialThinking(
  input: SequentialThinkingInput,
  messageId?: string
): Promise<SequentialThinkingOutput> {
  try {
    // Log the thinking step for debugging
    if (messageId) {
      console.info('[sequential-thinking] Processing thought:', {
        messageId,
        thoughtNumber: input.thoughtNumber,
        nextThoughtNeeded: input.nextThoughtNeeded,
      });
    }

    // The actual thinking logic is handled by the streaming callbacks
    // This execute function just confirms successful processing
    return {
      success: true,
    };
  } catch (error) {
    console.error('[sequential-thinking] Error in sequential thinking:', error);

    throw new Error(
      `Sequential thinking processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Factory function that creates the execute function with proper context typing
export function createSequentialThinkingExecute<TAgentContext extends SequentialThinkingContext>(
  context: TAgentContext
) {
  return wrapTraced(
    async (input: SequentialThinkingInput): Promise<SequentialThinkingOutput> => {
      // Use the messageId from the passed context
      const messageId = context.messageId;
      return await processSequentialThinking(input, messageId);
    },
    { name: 'Sequential Thinking Tool' }
  );
}
