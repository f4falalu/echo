import type { LanguageModelV2 } from '@ai-sdk/provider';
import type { Sandbox } from '@buster/sandbox';
import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import { wrapTraced } from 'braintrust';
import z from 'zod';
import { DEFAULT_ANTHROPIC_OPTIONS } from '../../llm/providers/gateway';
import { Sonnet4 } from '../../llm/sonnet-4';
import { bashExecute, createIdleTool } from '../../tools';
import { createWriteFileTool } from '../../tools/file-tools';
import { type AgentContext, repairToolCall } from '../../utils/tool-call-repair';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

export const DOCS_AGENT_NAME = 'docsAgent';

const STOP_CONDITIONS = [stepCountIs(50), hasToolCall('idleTool')];

const DocsAgentOptionsSchema = z.object({
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
});

const DocsStreamOptionsSchema = z.object({
  messages: z.array(z.custom<ModelMessage>()).describe('The messages to send to the docs agent'),
});

export type DocsAgentOptions = z.infer<typeof DocsAgentOptionsSchema>;
export type DocsStreamOptions = z.infer<typeof DocsStreamOptionsSchema>;

// Extended type for passing to tools (includes sandbox)
export type DocsAgentContextWithSandbox = DocsAgentOptions & { sandbox: Sandbox };

export function createDocsAgent(docsAgentOptions: DocsAgentOptions) {
  const systemMessage = {
    role: 'system',
    content: getDocsAgentSystemPrompt(docsAgentOptions.folder_structure),
    providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
  } as ModelMessage;

  const idleTool = createIdleTool();
  const writeFileTool = createWriteFileTool({
    messageId: docsAgentOptions.messageId,
    projectDirectory: docsAgentOptions.folder_structure,
  });

  // Create planning tools with simple context
  async function stream({ messages }: DocsStreamOptions) {
    // Collect available tools dynamically based on what's enabled
    const availableTools: string[] = ['sequentialThinking'];
    availableTools.push('executeSql');
    if (bashExecute) availableTools.push('bashExecute');
    availableTools.push('updateClarificationsFile', 'checkOffTodoList', 'idleTool', 'webSearch');

    const agentContext: AgentContext = {
      agentName: DOCS_AGENT_NAME,
      availableTools,
    };

    return wrapTraced(
      () =>
        streamText({
          model: docsAgentOptions.model || Sonnet4,
          providerOptions: DEFAULT_ANTHROPIC_OPTIONS,
          tools: {
            idleTool,
            writeFileTool,
          },
          messages: [systemMessage, ...messages],
          stopWhen: STOP_CONDITIONS,
          toolChoice: 'required',
          maxOutputTokens: 10000,
          temperature: 0,
          experimental_context: docsAgentOptions,
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
        }),
      {
        name: 'Docs Agent',
      }
    )();
  }

  return {
    stream,
  };
}
