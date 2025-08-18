import type { PermissionedDataset } from '@buster/access-controls';
import { type ModelMessage, NoSuchToolError, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm';
import { createExecuteSqlTool, createSequentialThinkingTool } from '../../tools';
import {
  MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME,
  createMessageUserClarifyingQuestionTool,
} from '../../tools/communication-tools/message-user-clarifying-question/message-user-clarifying-question';
import {
  RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME,
  createRespondWithoutAssetCreationTool,
} from '../../tools/communication-tools/respond-without-asset-creation/respond-without-asset-creation-tool';
import {
  SUBMIT_THOUGHTS_TOOL_NAME,
  createSubmitThoughtsTool,
} from '../../tools/communication-tools/submit-thoughts-tool/submit-thoughts-tool';
import { EXECUTE_SQL_TOOL_NAME } from '../../tools/database-tools/execute-sql/execute-sql';
import { SEQUENTIAL_THINKING_TOOL_NAME } from '../../tools/planning-thinking-tools/sequential-thinking-tool/sequential-thinking-tool';
import { healToolWithLlm } from '../../utils';
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
  hasToolCall(SUBMIT_THOUGHTS_TOOL_NAME),
  hasToolCall(RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME),
  hasToolCall(MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME),
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
  datasets: z
    .array(z.custom<PermissionedDataset>())
    .describe('The datasets available to the user.'),
  analysisMode: z
    .enum(['standard', 'investigation'])
    .default('standard')
    .describe('The analysis mode to determine which prompt to use.')
    .optional(),
  workflowStartTime: z.number().describe('The start time of the workflow'),
});

export const ThinkAndPrepStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the think and prep agent.'),
});

export type ThinkAndPrepAgentOptions = z.infer<typeof ThinkAndPrepAgentOptionsSchema>;
export type ThinkAndPrepStreamOptions = z.infer<typeof ThinkAndPrepStreamOptionsSchema>;

export function createThinkAndPrepAgent(thinkAndPrepAgentSchema: ThinkAndPrepAgentOptions) {
  const { messageId, datasets, workflowStartTime } = thinkAndPrepAgentSchema;

  const systemMessage = {
    role: 'system',
    content: getThinkAndPrepAgentSystemPrompt(
      thinkAndPrepAgentSchema.sql_dialect_guidance,
      (thinkAndPrepAgentSchema.analysisMode || 'standard') as AnalysisMode
    ),
    providerOptions: DEFAULT_CACHE_OPTIONS,
  } as ModelMessage;

  // Create second system message with datasets information
  const datasetsContent = datasets
    .filter((d) => d.ymlFile)
    .map((d) => d.ymlFile)
    .join('\n\n');

  const datasetsSystemMessage = {
    role: 'system',
    content: datasetsContent
      ? `<database_context>\n${datasetsContent}\n</database_context>`
      : '<database_context>\nNo datasets available\n</database_context>',
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
    const respondWithoutAssetCreation = createRespondWithoutAssetCreationTool({
      messageId,
      workflowStartTime,
    });
    const submitThoughts = createSubmitThoughtsTool();
    const messageUserClarifyingQuestion = createMessageUserClarifyingQuestionTool({
      messageId,
      workflowStartTime,
    });

    while (attempt <= maxRetries) {
      try {
        return wrapTraced(
          () =>
            streamText({
              model: Sonnet4,
              tools: {
                [SEQUENTIAL_THINKING_TOOL_NAME]: sequentialThinking,
                [EXECUTE_SQL_TOOL_NAME]: executeSqlTool,
                [RESPOND_WITHOUT_ASSET_CREATION_TOOL_NAME]: respondWithoutAssetCreation,
                [SUBMIT_THOUGHTS_TOOL_NAME]: submitThoughts,
                [MESSAGE_USER_CLARIFYING_QUESTION_TOOL_NAME]: messageUserClarifyingQuestion,
              },
              messages: [systemMessage, datasetsSystemMessage, ...currentMessages],
              stopWhen: STOP_CONDITIONS,
              toolChoice: 'required',
              maxOutputTokens: 10000,
              temperature: 0,
              experimental_repairToolCall: healToolWithLlm,
              onStepFinish: async (event) => {
                console.info('Think and Prep Agent step finished', {
                  toolCalls: event.toolCalls?.length || 0,
                  hasToolResults: !!event.toolResults,
                });
              },
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

  return {
    stream,
  };
}
