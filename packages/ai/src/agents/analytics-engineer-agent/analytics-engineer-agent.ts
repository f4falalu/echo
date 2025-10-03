import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../llm/providers/gateway';
import { Sonnet4 } from '../../llm/sonnet-4';
import { createIdleTool } from '../../tools';
import {
  createEditFileTool,
  createLsTool,
  createMultiEditFileTool,
  createWriteFileTool,
} from '../../tools/file-tools';
import { createBashTool } from '../../tools/file-tools/bash-tool/bash-tool';
import { createGrepTool } from '../../tools/file-tools/grep-tool/grep-tool';
import { createReadFileTool } from '../../tools/file-tools/read-file-tool/read-file-tool';
import { createTaskTool } from '../../tools/task-tools/task-tool/task-tool';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { getDocsAgentSystemPrompt as getAnalyticsEngineerAgentSystemPrompt } from './get-analytics-engineer-agent-system-prompt';
import type { ToolEventCallback } from './tool-events';

export const ANALYST_ENGINEER_AGENT_NAME = 'analyticsEngineerAgent';

const STOP_CONDITIONS = [stepCountIs(100), hasToolCall('idleTool')];

const AnalyticsEngineerAgentOptionsSchema = z.object({
  folder_structure: z.string().describe('The file structure of the dbt repository'),
  userId: z.string(),
  chatId: z.string(),
  dataSourceId: z.string(),
  organizationId: z.string(),
  messageId: z.string(),
  sandbox: z
    .custom<Sandbox>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'fs' in val;
      },
      { message: 'Invalid Sandbox instance' }
    )
    .optional(),
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
  skipTracing: z.boolean().optional().describe('Skip Braintrust tracing (useful for CLI mode)'),
});

const AnalyticsEngineerAgentStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type AnalyticsEngineerAgentOptions = z.infer<typeof AnalyticsEngineerAgentOptionsSchema> & {
  onToolEvent?: ToolEventCallback;
};
export type AnalyticsEngineerAgentStreamOptions = z.infer<
  typeof AnalyticsEngineerAgentStreamOptionsSchema
>;

// Extended type for passing to tools (includes sandbox)
export type DocsAgentContextWithSandbox = AnalyticsEngineerAgentOptions & { sandbox: Sandbox };

export function createAnalyticsEngineerAgent(
  analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions
) {
  const systemMessage = {
    role: 'system',
    content: getAnalyticsEngineerAgentSystemPrompt(analyticsEngineerAgentOptions.folder_structure),
    providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
  } as ModelMessage;

  const idleTool = createIdleTool({
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const writeFileTool = createWriteFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const grepTool = createGrepTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const readFileTool = createReadFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const bashTool = createBashTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const editFileTool = createEditFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const multiEditFileTool = createMultiEditFileTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });
  const lsTool = createLsTool({
    messageId: analyticsEngineerAgentOptions.messageId,
    projectDirectory: analyticsEngineerAgentOptions.folder_structure,
    onToolEvent: analyticsEngineerAgentOptions.onToolEvent,
  });

  // Conditionally create task tool (only for main agent, not for subagents)
  const taskTool = !analyticsEngineerAgentOptions.isSubagent
    ? createTaskTool({
        messageId: analyticsEngineerAgentOptions.messageId,
        projectDirectory: analyticsEngineerAgentOptions.folder_structure,
        // Wrap onToolEvent to ensure type compatibility - no optional chaining
        ...(analyticsEngineerAgentOptions.onToolEvent && {
          // biome-ignore lint/suspicious/noExplicitAny: Bridging between ToolEventType and parent's ToolEvent type
          onToolEvent: (event) => analyticsEngineerAgentOptions.onToolEvent?.(event as any),
        }),
        // Pass the agent factory function to enable task agent creation
        // This needs to match the AgentFactory type signature
        createAgent: (options) => {
          return createAnalyticsEngineerAgent({
            ...options,
            // Inherit model from parent agent if provided
            model: analyticsEngineerAgentOptions.model,
          });
        },
      })
    : null;

  // Create planning tools with simple context
  async function stream({ messages }: AnalyticsEngineerAgentStreamOptions) {
    // Collect available tools dynamically based on what's enabled
    const availableTools: string[] = ['sequentialThinking'];
    availableTools.push('executeSql');
    availableTools.push('updateClarificationsFile', 'checkOffTodoList', 'idleTool', 'webSearch');

    const agentContext: AgentContext = {
      agentName: ANALYST_ENGINEER_AGENT_NAME,
      availableTools,
    };

    // Build tools object conditionally including task tool
    // biome-ignore lint/suspicious/noExplicitAny: tools object contains various tool types
    const tools: Record<string, any> = {
      idleTool,
      grepTool,
      writeFileTool,
      readFileTool,
      bashTool,
      editFileTool,
      multiEditFileTool,
      lsTool,
    };

    // Add task tool only if not a subagent (prevent recursion)
    if (taskTool) {
      tools.taskTool = taskTool;
    }

    const streamFn = () =>
      streamText({
        model: analyticsEngineerAgentOptions.model || Sonnet4,
        providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
        tools,
        messages: [systemMessage, ...messages],
        stopWhen: STOP_CONDITIONS,
        toolChoice: 'required',
        maxOutputTokens: 10000,
        temperature: 0,
        experimental_context: analyticsEngineerAgentOptions,
        ...(analyticsEngineerAgentOptions.abortSignal && {
          abortSignal: analyticsEngineerAgentOptions.abortSignal,
        }),
        experimental_repairToolCall: async (repairContext) => {
          return repairToolCall({
            toolCall: repairContext.toolCall,
            tools: repairContext.tools,
            error: repairContext.error,
            messages: repairContext.messages,
            ...(repairContext.system && { system: repairContext.system }),
            ...(repairContext.inputSchema && { inputSchema: repairContext.inputSchema }),
            agentContext,
          });
        },
      });

    // Skip tracing for CLI mode
    if (analyticsEngineerAgentOptions.skipTracing) {
      return streamFn();
    }

    // Use Braintrust tracing for production
    return wrapTraced(streamFn, {
      name: 'Docs Agent',
    })();
  }

  return {
    stream,
  };
}
