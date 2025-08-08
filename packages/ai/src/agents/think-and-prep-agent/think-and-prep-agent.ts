import { type ModelMessage, NoSuchToolError, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../models/sonnet-4';
import { createSequentialThinkingTool, executeSql } from '../../tools';
import { createMessageUserClarifyingQuestionTool } from '../../tools/communication-tools/message-user-clarifying-question/message-user-clarifying-question';
import { createRespondWithoutAssetCreationTool } from '../../tools/communication-tools/respond-without-asset-creation/respond-without-asset-creation-tool';
import { createSubmitThoughtsTool } from '../../tools/communication-tools/submit-thoughts-tool/submit-thoughts-tool';
import { getThinkAndPrepAgentSystemPrompt } from './get-think-and-prep-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
};

const STOP_CONDITIONS = [
  stepCountIs(25),
  hasToolCall('submitThoughts'),
  hasToolCall('respondWithoutAssetCreation'),
  hasToolCall('messageUserClarifyingQuestion'),
];

const ThinkAndPrepAgentOptionsSchema = z.object({
  sql_dialect_guidance: z
    .string()
    .describe('The SQL dialect guidance for the think and prep agent.'),
  messageId: z.string().describe('The message ID for tracking tool execution.'),
});

const ThinkAndPrepStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the think and prep agent.'),
});

export type ThinkAndPrepAgentOptionsSchema = z.infer<typeof ThinkAndPrepAgentOptionsSchema>;
export type ThinkAndPrepStreamOptions = z.infer<typeof ThinkAndPrepStreamOptionsSchema>;

export function createThinkAndPrepAgent(thinkAndPrepAgentSchema: ThinkAndPrepAgentOptionsSchema) {
  const steps: never[] = [];
  const { messageId } = thinkAndPrepAgentSchema;

  const systemMessage = {
    role: 'system',
    content: getThinkAndPrepAgentSystemPrompt(thinkAndPrepAgentSchema.sql_dialect_guidance),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: ThinkAndPrepStreamOptions) {
    const maxRetries = 2;
    let attempt = 0;
    const currentMessages = [...messages];

    const sequentialThinking = createSequentialThinkingTool({ messageId });
    const executeSqlTool = executeSql;
    const respondWithoutAssetCreation = createRespondWithoutAssetCreationTool({ messageId });
    const submitThoughts = createSubmitThoughtsTool({ messageId });
    const messageUserClarifyingQuestion = createMessageUserClarifyingQuestionTool({ messageId });

    while (attempt <= maxRetries) {
      try {
        return await wrapTraced(
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
