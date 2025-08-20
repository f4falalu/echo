import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { type ModelMessage, NoSuchToolError, generateText } from 'ai';
import { wrapTraced } from 'braintrust';
import { ANALYST_AGENT_NAME, DOCS_AGENT_NAME, THINK_AND_PREP_AGENT_NAME } from '../../../agents';
import { Sonnet4 } from '../../../llm';
import type { RepairContext, RepairStrategy } from '../types';

export class ReAskStrategy implements RepairStrategy {
  canHandle(error: Error): boolean {
    return NoSuchToolError.isInstance(error);
  }

  async repair(context: RepairContext): Promise<LanguageModelV2ToolCall | null> {
    return wrapTraced(
      async () => {
        // Build error message based on agent context
        const errorMessage = this.buildErrorMessage(context);

        // Create the tool-result message with the error
        // Ensure input is properly formatted
        let toolInput = context.toolCall.input;
        if (typeof toolInput === 'string') {
          try {
            // Try to parse it if it's a JSON string
            JSON.parse(toolInput);
          } catch {
            // If it's not valid JSON, wrap it in an object
            toolInput = JSON.stringify({ value: toolInput });
          }
        } else if (toolInput && typeof toolInput === 'object') {
          // If it's already an object, stringify it
          toolInput = JSON.stringify(toolInput);
        } else {
          // Default to empty object
          toolInput = '{}';
        }

        const healingMessages: ModelMessage[] = [
          ...context.messages,
          {
            role: 'assistant',
            content: [
              {
                type: 'tool-call',
                toolCallId: context.toolCall.toolCallId,
                toolName: context.toolCall.toolName,
                input: toolInput,
              },
            ],
          },
          {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: context.toolCall.toolCallId,
                toolName: context.toolCall.toolName,
                output: {
                  type: 'text',
                  value: errorMessage,
                },
              },
            ],
          },
        ];

        try {
          // Re-ask with the error context
          const generateOptions = {
            model: Sonnet4,
            messages: healingMessages,
            tools: context.tools,
            maxOutputTokens: 1000,
            temperature: 0,
          };

          console.info('Re-asking with corrected tool context', {
            originalTool: context.toolCall.toolName,
            availableTools: Object.keys(context.tools),
            messageCount: healingMessages.length,
          });

          const result = await generateText(generateOptions);

          // Find the corrected tool call
          const newToolCall = result.toolCalls.find((tc) => tc.toolName in context.tools);

          if (newToolCall) {
            console.info('Successfully re-asked and got corrected tool call', {
              originalTool: context.toolCall.toolName,
              correctedTool: newToolCall.toolName,
            });

            return {
              type: 'tool-call',
              toolCallType: 'function' as const,
              toolCallId: context.toolCall.toolCallId,
              toolName: newToolCall.toolName,
              input: JSON.stringify(newToolCall.input),
            } as unknown as LanguageModelV2ToolCall;
          }

          console.warn('Re-ask strategy did not produce a valid tool call', {
            toolName: context.toolCall.toolName,
            availableTools: Object.keys(context.tools),
          });
          return null;
        } catch (error) {
          console.error('Failed to re-ask for corrected tool call:', {
            error,
            toolName: context.toolCall.toolName,
            originalInput: context.toolCall.input,
            errorMessage: error instanceof Error ? error.message : String(error),
          });

          // Check if it's a validation error and provide more context
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (
            errorMessage.includes('Input should be a valid dictionary') ||
            errorMessage.includes('tool_use.input')
          ) {
            throw new Error(
              `Failed to re-ask for tool "${context.toolCall.toolName}": Invalid tool input format. ` +
                `Original input type: ${typeof context.toolCall.input}. Error: ${errorMessage}`
            );
          }

          throw new Error(
            `Failed to re-ask for tool "${context.toolCall.toolName}": ${errorMessage}`
          );
        }
      },
      { name: 'Tool Call Healing - Re-Ask' }
    )();
  }

  private buildErrorMessage(context: RepairContext): string {
    const { agentContext, toolCall } = context;

    if (!agentContext) {
      const availableTools = Object.keys(context.tools).join(', ');
      return `Tool "${toolCall.toolName}" is not available. Available tools: ${availableTools}`;
    }

    // Agent-specific messages
    switch (agentContext.agentName) {
      case ANALYST_AGENT_NAME:
        return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}.
        
        The previous phase of the workflow was the think and prep phase that has access to the following tools:
        sequentialThinking, executeSql, respondWithoutAssetCreation, submitThoughts, messageUserClarifyingQuestion
        
        However, you don't have access to any of those tools at this moment.`;

      case THINK_AND_PREP_AGENT_NAME:
        return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}.
        
        The next phase of the workflow will be the analyst that has access to the following tools:
        createMetrics, modifyMetrics, createDashboards, modifyDashboards, createReports, modifyReports, doneTool
        
        You'll be able to use those when they are available to you.`;

      case DOCS_AGENT_NAME:
        return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}.
        
        Please use one of the available tools to complete your task.`;

      default:
        return `Tool "${toolCall.toolName}" is not available. Available tools: ${agentContext.availableTools.join(', ')}`;
    }
  }
}
