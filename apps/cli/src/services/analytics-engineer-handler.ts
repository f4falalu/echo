import { randomUUID } from 'node:crypto';
import type { ModelMessage } from '@buster/ai';
import { createAnalyticsEngineerAgent } from '@buster/ai/agents/analytics-engineer-agent/analytics-engineer-agent';
import { createProxyModel } from '@buster/ai/llm/providers/proxy-model';
import type { AgentMessage } from '../types/agent-messages';
import { getProxyConfig } from '../utils/ai-proxy';
import { loadConversation, saveModelMessages } from '../utils/conversation-history';

/**
 * CLI wrapper for agent messages with unique ID for React keys
 */
export interface CliAgentMessage {
  id: number;
  message: AgentMessage;
}

export interface RunAnalyticsEngineerAgentParams {
  chatId: string;
  workingDirectory: string;
  isInResearchMode?: boolean;
  onThinkingStateChange?: (thinking: boolean) => void;
  onMessageUpdate?: (messages: ModelMessage[]) => void;
  abortSignal?: AbortSignal;
}

/**
 * Runs the analytics engineer agent in the CLI without sandbox
 * The agent runs locally but uses the proxy model to route LLM calls through the server
 * Messages are emitted via callback for immediate UI updates and saved to disk for persistence
 */
export async function runAnalyticsEngineerAgent(params: RunAnalyticsEngineerAgentParams) {
  const { chatId, workingDirectory, isInResearchMode, onThinkingStateChange, onMessageUpdate, abortSignal } = params;

  // Load conversation history to maintain context across sessions
  const conversation = await loadConversation(chatId, workingDirectory);

  // Get the stored model messages (full conversation including tool calls/results)
  const previousMessages: ModelMessage[] = conversation
    ? (conversation.modelMessages as ModelMessage[])
    : [];

  // Get proxy configuration
  const proxyConfig = await getProxyConfig();

  // Create proxy model that routes through server
  const proxyModel = createProxyModel({
    baseURL: proxyConfig.baseURL,
    apiKey: proxyConfig.apiKey,
    modelId: 'anthropic/claude-sonnet-4.5',
  });

  // Create the docs agent with proxy model
  // Tools are handled locally, only model calls go through proxy
  const analyticsEngineerAgent = createAnalyticsEngineerAgent({
    folder_structure: process.cwd(), // Use current working directory for CLI mode
    userId: 'cli-user',
    chatId: chatId,
    dataSourceId: '',
    organizationId: 'cli',
    messageId: randomUUID(),
    todosList: [],
    model: proxyModel,
    abortSignal,
    apiKey: proxyConfig.apiKey,
    apiUrl: proxyConfig.baseURL,
    isInResearchMode: isInResearchMode || false,
  });

  // Use conversation history - includes user messages, assistant messages, tool calls, and tool results
  const messages: ModelMessage[] = previousMessages;

  // Start the stream - this triggers the agent to run
  const stream = await analyticsEngineerAgent.stream({ messages });

  // Notify thinking state
  onThinkingStateChange?.(true);

  // Track accumulated messages as we stream
  let currentMessages = [...messages];
  let accumulatedText = '';
  let pendingToolCalls: any[] = [];

  // Consume the stream
  for await (const part of stream.fullStream) {
    if (part.type === 'tool-call') {
      // Collect tool call - multiple can come in a single turn
      pendingToolCalls.push({
        type: 'tool-call',
        toolCallId: part.toolCallId,
        toolName: part.toolName,
        input: part.input,
      });
    }

    if (part.type === 'tool-result') {
      // Before processing first tool result, create assistant message with all tool calls
      if (pendingToolCalls.length > 0) {
        const toolCallMessage: ModelMessage = {
          role: 'assistant',
          content: pendingToolCalls,
        };
        currentMessages.push(toolCallMessage);
        onMessageUpdate?.(currentMessages);
        await saveModelMessages(chatId, workingDirectory, currentMessages);
        pendingToolCalls = []; // Clear pending tool calls
      }

      // Add tool result message
      const toolResultMessage: ModelMessage = {
        role: 'tool',
        content: [
          {
            type: 'tool-result',
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            output: {
              type: 'json',
              value: typeof part.output === 'string' ? part.output : JSON.stringify(part.output),
            },
          },
        ],
      };
      currentMessages.push(toolResultMessage);
      onMessageUpdate?.(currentMessages);
      await saveModelMessages(chatId, workingDirectory, currentMessages);
    }

    if (part.type === 'text-delta') {
      accumulatedText += part.text;
    }

    if (part.type === 'finish') {
      // If there are pending tool calls but no results (shouldn't happen normally), flush them
      if (pendingToolCalls.length > 0) {
        const toolCallMessage: ModelMessage = {
          role: 'assistant',
          content: pendingToolCalls,
        };
        currentMessages.push(toolCallMessage);
        pendingToolCalls = [];
      }

      // Add final assistant message if there's any text
      if (accumulatedText.trim()) {
        const assistantMessage: ModelMessage = {
          role: 'assistant',
          content: accumulatedText,
        };
        currentMessages.push(assistantMessage);
      }

      // Update state with final messages
      onMessageUpdate?.(currentMessages);

      // Save to disk
      await saveModelMessages(chatId, workingDirectory, currentMessages);

      onThinkingStateChange?.(false);
    }
  }
}
