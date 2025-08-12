import { type ModelMessage, NoSuchToolError, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm';
import { createExecuteSqlTool, createSequentialThinkingTool } from '../../tools';
import { createMessageUserClarifyingQuestionTool } from '../../tools/communication-tools/message-user-clarifying-question/message-user-clarifying-question';
import { createRespondWithoutAssetCreationTool } from '../../tools/communication-tools/respond-without-asset-creation/respond-without-asset-creation-tool';
import { createSubmitThoughtsTool } from '../../tools/communication-tools/submit-thoughts-tool/submit-thoughts-tool';
import {
  type AnalysisMode,
  getThinkAndPrepAgentSystemPrompt,
} from './get-think-and-prep-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
  openai: {
    parallelToolCalls: false,
    reasoningEffort: 'minimal',
  },
};

const STOP_CONDITIONS = [
  stepCountIs(25),
  hasToolCall('submitThoughts'),
  hasToolCall('respondWithoutAssetCreation'),
  hasToolCall('messageUserClarifyingQuestion'),
];

export const ThinkAndPrepAgentOptionsSchema = z.object({
  sql_dialect_guidance: z
    .string()
    .describe('The SQL dialect guidance for the think and prep agent.'),
  messageId: z.string().describe('The message ID for tracking tool execution.'),
  chatId: z.string().describe('The chat ID for tracking tool execution.'),
  organizationId: z.string().describe('The organization ID for tracking tool execution.'),
  dataSourceId: z.string().describe('The data source ID for tracking tool execution.'),
  dataSourceSyntax: z.string().describe('The data source syntax for tracking tool execution.'),
  userId: z.string().describe('The user ID for tracking tool execution.'),
  analysisMode: z
    .enum(['standard', 'investigation'])
    .default('standard')
    .describe('The analysis mode to determine which prompt to use.')
    .optional(),
});

export const ThinkAndPrepStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the think and prep agent.'),
});

export type ThinkAndPrepAgentOptions = z.infer<typeof ThinkAndPrepAgentOptionsSchema>;
export type ThinkAndPrepStreamOptions = z.infer<typeof ThinkAndPrepStreamOptionsSchema>;

export function createThinkAndPrepAgent(thinkAndPrepAgentSchema: ThinkAndPrepAgentOptions) {
  const steps: never[] = [];
  const { messageId } = thinkAndPrepAgentSchema;

  const systemMessage = {
    role: 'system',
    content: getThinkAndPrepAgentSystemPrompt(
      thinkAndPrepAgentSchema.sql_dialect_guidance,
      (thinkAndPrepAgentSchema.analysisMode || 'standard') as AnalysisMode
    ),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: ThinkAndPrepStreamOptions) {
    const maxRetries = 2;
    let attempt = 0;
    const currentMessages = [...messages];

    const sequentialThinking = createSequentialThinkingTool({ messageId });
    const executeSqlTool = createExecuteSqlTool({
      messageId,
      dataSourceId: thinkAndPrepAgentSchema.dataSourceId,
      dataSourceSyntax: thinkAndPrepAgentSchema.dataSourceSyntax,
      userId: thinkAndPrepAgentSchema.userId,
    });
    const respondWithoutAssetCreation = createRespondWithoutAssetCreationTool({ messageId });
    const submitThoughts = createSubmitThoughtsTool();
    const messageUserClarifyingQuestion = createMessageUserClarifyingQuestionTool({ messageId });

    while (attempt <= maxRetries) {
      try {
        return wrapTraced(
          () =>
            streamText({
              model: Sonnet4,
              tools: {
                sequentialThinking,
                executeSql: executeSqlTool,
                respondWithoutAssetCreation,
                submitThoughts,
                messageUserClarifyingQuestion,
              },
              messages: [systemMessage, ...currentMessages],
              stopWhen: STOP_CONDITIONS,
              toolChoice: 'required',
              maxOutputTokens: 10000,
              temperature: 0,
            }),
          {
            name: 'Think and Prep Agent',
          }
        )();
      } catch (error) {
        attempt++;

        // Only retry for NoSuchToolError
        if (!NoSuchToolError.isInstance(error) || attempt > maxRetries) {
          console.error('Error in think and prep agent:', error);
          throw error;
        }

        // Add healing message and retry
        const toolName = 'toolName' in error ? String(error.toolName) : 'unknown';
        const toolCallId = 'toolCallId' in error ? String(error.toolCallId) : 'unknown';

        const healingMessage: ModelMessage = {
          role: 'tool',
          content: [
            {
              type: 'tool-result',
              toolCallId,
              toolName,
              output: {
                type: 'text',
                value: `Tool "${toolName}" is not available. Available tools: sequentialThinking, executeSql, respondWithoutAssetCreation, submitThoughts, messageUserClarifyingQuestion.
                
                The next phase of the workflow will be the analyst that has access to the following tools:
                createMetrics, modifyMetrics, createDashboards, modifyDashboards, doneTool
                
                You'll be able to use those when they are available to you.`,
              },
            },
          ],
        };
        currentMessages.push(healingMessage);

        console.info(
          `Retrying think and prep agent after NoSuchToolError (attempt ${attempt}/${maxRetries})`
        );
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  async function getSteps() {
    return steps;
  }

  return {
    stream,
    getSteps,
  };
}
