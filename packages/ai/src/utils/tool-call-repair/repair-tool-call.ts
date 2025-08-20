import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { wrapTraced } from 'braintrust';
import { ReAskStrategy, StructuredOutputStrategy } from './strategies';
import type { RepairContext, RepairStrategy } from './types';

const strategies: RepairStrategy[] = [new StructuredOutputStrategy(), new ReAskStrategy()];

export async function repairToolCall(
  context: RepairContext
): Promise<LanguageModelV2ToolCall | null> {
  return wrapTraced(
    async () => {
      const strategy = strategies.find((s) => s.canHandle(context.error));

      if (!strategy) {
        console.error('No repair strategy found for error:', {
          errorType: context.error.constructor.name,
          errorMessage: context.error.message,
          toolName: context.toolCall.toolName,
        });
        return null;
      }

      console.info('Attempting to repair tool call', {
        toolName: context.toolCall.toolName,
        errorType: context.error.constructor.name,
        strategy: strategy.constructor.name,
        agentName: context.agentContext?.agentName,
      });

      try {
        const repairedToolCall = await strategy.repair(context);

        if (repairedToolCall) {
          console.info('Tool call repaired successfully', {
            originalTool: context.toolCall.toolName,
            repairedTool: repairedToolCall.toolName,
            strategy: strategy.constructor.name,
            agentName: context.agentContext?.agentName,
          });
        } else {
          console.warn('Tool call repair returned null', {
            toolName: context.toolCall.toolName,
            strategy: strategy.constructor.name,
          });
        }

        return repairedToolCall;
      } catch (error) {
        console.error('Failed to repair tool call:', {
          error,
          toolName: context.toolCall.toolName,
          strategy: strategy.constructor.name,
        });
        // Return null instead of throwing to let the SDK handle it
        return null;
      }
    },
    { name: 'Tool Call Healing' }
  )();
}
