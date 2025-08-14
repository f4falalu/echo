import type { PermissionedDataset } from '@buster/access-controls';
import { type ModelMessage, NoSuchToolError, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { Sonnet4 } from '../../llm';
import {
  createCreateDashboardsTool,
  createCreateMetricsTool,
  createCreateReportsTool,
  createDoneTool,
  createModifyDashboardsTool,
  createModifyMetricsTool,
  createModifyReportsTool,
} from '../../tools';
import { DONE_TOOL_NAME } from '../../tools/communication-tools/done-tool/done-tool';
import { CREATE_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/create-dashboards-tool/create-dashboards-tool';
import { MODIFY_DASHBOARDS_TOOL_NAME } from '../../tools/visualization-tools/dashboards/modify-dashboards-tool/modify-dashboards-tool';
import { CREATE_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/create-metrics-tool/create-metrics-tool';
import { MODIFY_METRICS_TOOL_NAME } from '../../tools/visualization-tools/metrics/modify-metrics-tool/modify-metrics-tool';
import { CREATE_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/create-reports-tool/create-reports-tool';
import { MODIFY_REPORTS_TOOL_NAME } from '../../tools/visualization-tools/reports/modify-reports-tool/modify-reports-tool';
import { healToolWithLlm } from '../../utils/tool-call-repair';
import { getAnalystAgentSystemPrompt } from './get-analyst-agent-system-prompt';

const DEFAULT_CACHE_OPTIONS = {
  anthropic: { cacheControl: { type: 'ephemeral', ttl: '1h' } },
  openai: {
    parallelToolCalls: false,
    reasoningEffort: 'minimal',
  },
};

const STOP_CONDITIONS = [stepCountIs(25), hasToolCall(DONE_TOOL_NAME)];

export const AnalystAgentOptionsSchema = z.object({
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  dataSourceSyntax: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  datasets: z.array(z.custom<PermissionedDataset>()),
  workflowStartTime: z.number(),
});

export const AnalystStreamOptionsSchema = z.object({
  messages: z
    .array(z.custom<ModelMessage>())
    .describe('The messages to send to the analyst agent.'),
});

export type AnalystAgentOptions = z.infer<typeof AnalystAgentOptionsSchema>;
export type AnalystStreamOptions = z.infer<typeof AnalystStreamOptionsSchema>;

export function createAnalystAgent(analystAgentOptions: AnalystAgentOptions) {
  const { datasets } = analystAgentOptions;

  const systemMessage = {
    role: 'system',
    content: getAnalystAgentSystemPrompt(analystAgentOptions.dataSourceSyntax),
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

  async function stream({ messages }: AnalystStreamOptions) {
    const maxRetries = 2;
    let attempt = 0;
    const currentMessages = [...messages];

    const createMetrics = createCreateMetricsTool(analystAgentOptions);
    const modifyMetrics = createModifyMetricsTool(analystAgentOptions);
    const createDashboards = createCreateDashboardsTool(analystAgentOptions);
    const modifyDashboards = createModifyDashboardsTool(analystAgentOptions);
    const createReports = createCreateReportsTool(analystAgentOptions);
    const modifyReports = createModifyReportsTool(analystAgentOptions);
    const doneTool = createDoneTool(analystAgentOptions);

    while (attempt <= maxRetries) {
      try {
        return wrapTraced(
          () =>
            streamText({
              model: Sonnet4,
              tools: {
                [CREATE_METRICS_TOOL_NAME]: createMetrics,
                [MODIFY_METRICS_TOOL_NAME]: modifyMetrics,
                [CREATE_DASHBOARDS_TOOL_NAME]: createDashboards,
                [MODIFY_DASHBOARDS_TOOL_NAME]: modifyDashboards,
                [CREATE_REPORTS_TOOL_NAME]: createReports,
                [MODIFY_REPORTS_TOOL_NAME]: modifyReports,
                [DONE_TOOL_NAME]: doneTool,
              },
              messages: [systemMessage, datasetsSystemMessage, ...currentMessages],
              stopWhen: STOP_CONDITIONS,
              toolChoice: 'required',
              maxOutputTokens: 10000,
              temperature: 0,
              experimental_repairToolCall: healToolWithLlm,
              onFinish: () => {
                console.info('Analyst Agent finished');
              },
            }),
          {
            name: 'Analyst Agent',
          }
        )();
      } catch (error) {
        attempt++;

        // Only retry for NoSuchToolError
        if (!NoSuchToolError.isInstance(error) || attempt > maxRetries) {
          console.error('Error in analyst agent:', error);
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
                value: `Tool "${toolName}" is not available. Available tools: createMetrics, modifyMetrics, createDashboards, modifyDashboards, doneTool.
                
                The previous phase of the workflow was the think and prep phase that has access to the following tools:
                sequentialThinking, executeSql, respondWithoutAssetCreation, submitThoughts, messageUserClarifyingQuestion
                
                However, you don't have access to any of those tools at this moment.`,
              },
            },
          ],
        };
        currentMessages.push(healingMessage);

        console.info(
          `Retrying analyst agent after NoSuchToolError (attempt ${attempt}/${maxRetries})`
        );
      }
    }

    throw new Error('Max retry attempts exceeded');
  }

  return {
    stream,
  };
}
