import { randomUUID } from 'node:crypto';
import { createDocsAgent } from '@buster/ai/agents/docs-agent/docs-agent';
import { createProxyModel } from '@buster/ai/llm/providers/proxy-model';
import type { ModelMessage } from 'ai';
import { getProxyConfig } from '../utils/ai-proxy';

export interface DocsAgentMessage {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  messageType?: 'PLAN' | 'EDIT' | 'EXECUTE' | 'WRITE' | 'WEB_SEARCH';
  metadata?: string;
}

export interface RunDocsAgentParams {
  userMessage: string;
  onMessage: (message: DocsAgentMessage) => void;
}

/**
 * Runs the docs agent in the CLI without sandbox
 * The agent runs locally but uses the proxy model to route LLM calls through the server
 */
export async function runDocsAgent(params: RunDocsAgentParams): Promise<void> {
  const { userMessage, onMessage } = params;

  let messageId = 1;

  // Get proxy configuration
  const proxyConfig = await getProxyConfig();

  // Create proxy model that routes through server
  const proxyModel = createProxyModel({
    baseURL: proxyConfig.baseURL,
    apiKey: proxyConfig.apiKey,
    modelId: 'anthropic/claude-4-sonnet-20250514',
  });

  // Create the docs agent with proxy model
  // Tools are handled locally, only model calls go through proxy
  const docsAgent = createDocsAgent({
    folder_structure: 'CLI mode - limited file access',
    userId: 'cli-user',
    chatId: randomUUID(),
    dataSourceId: '',
    organizationId: 'cli',
    messageId: randomUUID(),
    model: proxyModel,
  });

  const messages: ModelMessage[] = [
    {
      role: 'user',
      content: userMessage,
    },
  ];

  try {
    // Execute the docs agent
    const result = await docsAgent.stream({ messages });

    // Stream the response
    for await (const part of result.fullStream) {
      // Handle different stream part types
      if (part.type === 'text-delta') {
        onMessage({
          id: messageId++,
          type: 'assistant',
          content: part.delta,
        });
      } else if (part.type === 'tool-call') {
        // Map tool calls to message types
        let messageType: DocsAgentMessage['messageType'];
        let content = '';
        const metadata = '';

        switch (part.toolName) {
          case 'sequentialThinking':
            messageType = 'PLAN';
            content = 'Planning next steps...';
            break;
          case 'bashExecute':
            messageType = 'EXECUTE';
            content = 'Executing command...';
            break;
          case 'webSearch':
            messageType = 'WEB_SEARCH';
            content = 'Searching the web...';
            break;
          case 'grepSearch':
            messageType = 'EXECUTE';
            content = 'Searching files...';
            break;
          case 'idleTool':
            messageType = 'EXECUTE';
            content = 'Entering idle state...';
            break;
          default:
            content = `Using tool: ${part.toolName}`;
        }

        onMessage({
          id: messageId++,
          type: 'assistant',
          content,
          messageType,
          metadata,
        });
      }
      // Ignore other stream part types (start, finish, etc.)
    }
  } catch (error) {
    onMessage({
      id: messageId++,
      type: 'assistant',
      content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
  }
}
