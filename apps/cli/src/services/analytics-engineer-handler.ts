import { randomUUID } from 'node:crypto';
import type { ModelMessage, ToolEvent } from '@buster/ai';
import { createAnalyticsEngineerAgent } from '@buster/ai/agents/analytics-engineer-agent/analytics-engineer-agent';
import { createProxyModel } from '@buster/ai/llm/providers/proxy-model';
import type { AgentMessage } from '../types/agent-messages';
import { getProxyConfig } from '../utils/ai-proxy';

export interface DocsAgentMessage {
  message: AgentMessage;
}

export interface RunDocsAgentParams {
  chatId: string;
  userMessage: string;
  onMessage: (message: DocsAgentMessage) => void;
}

/**
 * Runs the docs agent in the CLI without sandbox
 * The agent runs locally but uses the proxy model to route LLM calls through the server
 */
export async function runDocsAgent(params: RunDocsAgentParams) {
  const { chatId, userMessage, onMessage } = params;

  // Get proxy configuration
  const proxyConfig = await getProxyConfig();

  // Create proxy model that routes through server
  const proxyModel = createProxyModel({
    baseURL: proxyConfig.baseURL,
    apiKey: proxyConfig.apiKey,
    modelId: 'anthropic/claude-4-sonnet-20250514',
  });

  // Create the docs agent with proxy model and typed event callback
  // Tools are handled locally, only model calls go through proxy
  const analyticsEngineerAgent = createAnalyticsEngineerAgent({
    folder_structure: process.cwd(), // Use current working directory for CLI mode
    userId: 'cli-user',
    chatId: chatId,
    dataSourceId: '',
    organizationId: 'cli',
    messageId: randomUUID(),
    model: proxyModel,
    // Handle typed tool events - TypeScript knows exact shape based on discriminants
    onToolEvent: (event: ToolEvent) => {
      // Type narrowing: TypeScript knows event.args and event.result types!
      if (event.tool === 'idleTool' && event.event === 'complete') {
        // event.args is IdleInput, event.result is IdleOutput - fully typed!
        onMessage({
          message: {
            kind: 'idle',
            args: event.args, // Type-safe: IdleInput
          },
        });
      }

      // Handle bash tool events - only show complete to avoid duplicates
      if (event.tool === 'bashTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'bash',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: BashToolOutput
          },
        });
      }

      // Handle grep tool events - only show complete to avoid duplicates
      if (event.tool === 'grepTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'grep',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: GrepToolOutput
          },
        });
      }

      // Handle ls tool events - only show complete to avoid duplicates
      if (event.tool === 'lsTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'ls',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: LsToolOutput
          },
        });
      }

      // Handle write tool events - only show complete to avoid duplicates
      if (event.tool === 'writeFileTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'write',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: WriteFileToolOutput
          },
        });
      }

      // Handle edit tool events (both editFileTool and multiEditFileTool) - only show complete to avoid duplicates
      if (event.tool === 'editFileTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'edit',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: EditFileToolOutput or MultiEditFileToolOutput
          },
        });
      }

      // Handle read tool events - only show complete to avoid duplicates
      if (event.tool === 'readFileTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'read',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: ReadFileToolOutput
          },
        });
      }

      // Handle subagent tool events - only show complete to avoid duplicates
      if (event.tool === 'subagentTool' && event.event === 'complete') {
        onMessage({
          message: {
            kind: 'subagent',
            event: 'complete',
            args: event.args,
            result: event.result, // Type-safe: SubagentToolOutput
          },
        });
      }
    },
  });

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  // Start the stream - this triggers the agent to run
  const stream = await analyticsEngineerAgent.stream({ messages });

  // Consume the stream to trigger tool execution
  // Tools will call callbacks directly when they execute
  for await (const _part of stream.fullStream) {
    // Stream parts are consumed but tools handle their own display via callbacks
    // In the future we could handle text-delta here if needed
  }
}
