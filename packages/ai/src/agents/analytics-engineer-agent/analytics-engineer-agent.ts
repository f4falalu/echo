import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../llm/providers/gateway';
import { Sonnet4 } from '../../llm/sonnet-4';
import { createIdleTool } from '../../tools';
import { IDLE_TOOL_NAME } from '../../tools/communication-tools/idle-tool/idle-tool';
import {
  createEditFileTool,
  createLsTool,
  createMultiEditFileTool,
  createWriteFileTool,
} from '../../tools/file-tools';
import { createBashTool } from '../../tools/file-tools/bash-tool/bash-tool';
import { BASH_TOOL_NAME } from '../../tools/file-tools/bash-tool/bash-tool';
import { EDIT_FILE_TOOL_NAME } from '../../tools/file-tools/edit-file-tool/edit-file-tool';
import { GREP_TOOL_NAME, createGrepTool } from '../../tools/file-tools/grep-tool/grep-tool';
import { LS_TOOL_NAME } from '../../tools/file-tools/ls-tool/ls-tool';
import { MULTI_EDIT_FILE_TOOL_NAME } from '../../tools/file-tools/multi-edit-file-tool/multi-edit-file-tool';
import { READ_FILE_TOOL_NAME, createReadFileTool } from '../../tools/file-tools/read-file-tool/read-file-tool';
import { WRITE_FILE_TOOL_NAME } from '../../tools/file-tools/write-file-tool/write-file-tool';
import { createTaskTool } from '../../tools/task-tools/task-tool/task-tool';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { createAnalyticsEngineerToolset } from './create-analytics-engineer-toolset';
import { getDocsAgentSystemPrompt as getAnalyticsEngineerAgentSystemPrompt } from './get-analytics-engineer-agent-system-prompt';

export const ANALYST_ENGINEER_AGENT_NAME = 'analyticsEngineerAgent';

const STOP_CONDITIONS = [stepCountIs(100), hasToolCall(IDLE_TOOL_NAME)];

export const TodoItemSchema = z.object({
  id: z.string().describe('Unique identifier for the todo item. Use existing ID to update, or generate new ID for new items'),
  content: z.string().describe('The content/description of the todo'),
  status: z.enum(['pending', 'in_progress', 'completed']).describe('Current status of the todo'),
  createdAt: z.string().datetime().optional().describe('ISO timestamp when todo was created (optional, will be set automatically for new items)'),
  completedAt: z.string().datetime().optional().describe('ISO timestamp when todo was completed (optional)'),
});

export type TodoItem = z.infer<typeof TodoItemSchema>;

const AnalyticsEngineerAgentOptionsSchema = z.object({
  folder_structure: z.string().describe('The file structure of the dbt repository'),
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  todosList:
    z
      .array(TodoItemSchema)
      .optional()
      .describe('Array of todo items to write/update. Include all todos with their current state.'),
  model: z
    .custom<LanguageModelV2>()
    .optional()
    .describe('Custom language model to use (defaults to Sonnet4)'),
  isSubagent: z
    .boolean()
    .optional()
    .describe('Flag indicating this is a subagent (prevents infinite recursion)'),
  abortSignal: z
    .custom<AbortSignal>()
    .optional()
    .describe('Optional abort signal to cancel agent execution'),
});

const AnalyticsEngineerAgentStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type AnalyticsEngineerAgentStreamOptions = z.infer<
  typeof AnalyticsEngineerAgentStreamOptionsSchema
>;

export type AnalyticsEngineerAgentOptions = z.infer<
  typeof AnalyticsEngineerAgentOptionsSchema
>;


export function createAnalyticsEngineerAgent(
  analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions
) {
  const systemMessage = {
    role: 'system',
    content: getAnalyticsEngineerAgentSystemPrompt(analyticsEngineerAgentOptions.folder_structure),
    providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: AnalyticsEngineerAgentStreamOptions) {

    const toolSet = await createAnalyticsEngineerToolset(analyticsEngineerAgentOptions);

    const streamFn = () =>
      streamText({
        model: analyticsEngineerAgentOptions.model || Sonnet4,
        providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
        tools: toolSet,
        messages: [systemMessage, ...messages],
        stopWhen: STOP_CONDITIONS,
        toolChoice: 'required',
        maxOutputTokens: 10000,
        temperature: 0,
      });

    return streamFn();
  }

  return {
    stream,
  };
}
