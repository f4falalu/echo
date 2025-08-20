import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { InvalidToolInputError, generateObject } from 'ai';
import { wrapTraced } from 'braintrust';
import { Sonnet4 } from '../../../llm';
import type { RepairContext, RepairStrategy } from '../types';

interface ToolCallWithArgs extends LanguageModelV2ToolCall {
  args?: unknown;
}

export class StructuredOutputStrategy implements RepairStrategy {
  canHandle(error: Error): boolean {
    return error instanceof InvalidToolInputError;
  }

  async repair(context: RepairContext): Promise<LanguageModelV2ToolCall | null> {
    return wrapTraced(
      async () => {
        const tool = context.tools[context.toolCall.toolName as keyof typeof context.tools];

        if (!tool) {
          console.error(`Tool ${context.toolCall.toolName} not found`);
          return null;
        }

        if (!tool.inputSchema) {
          console.error(`Tool ${context.toolCall.toolName} has no input schema`);
          return null;
        }

        // Type assertion to access args property
        const toolCallWithArgs = context.toolCall as ToolCallWithArgs;

        try {
          const { object: repairedArgs } = await generateObject({
            model: Sonnet4,
            schema: tool.inputSchema,
            prompt: [
              `The model tried to call the tool "${context.toolCall.toolName}"`,
              `with the following arguments:`,
              JSON.stringify(toolCallWithArgs.args),
              `The tool accepts the following schema:`,
              JSON.stringify(tool.inputSchema),
              'Please fix the arguments.',
            ].join('\n'),
          });

          console.info('Successfully repaired tool arguments', {
            toolName: context.toolCall.toolName,
            originalArgs: toolCallWithArgs.args,
            repairedArgs,
          });

          return { ...context.toolCall, args: repairedArgs } as LanguageModelV2ToolCall;
        } catch (error) {
          console.error('Failed to repair tool arguments with structured output:', error);
          console.error('Tool call that failed:', context.toolCall);

          throw new Error(
            `Failed to repair tool call "${context.toolCall.toolName}": ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      },
      { name: 'Tool Call Healing - Structured Output' }
    )();
  }
}
