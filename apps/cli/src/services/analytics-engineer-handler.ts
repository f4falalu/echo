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
  onThinkingStateChange?: (thinking: boolean) => void;
  abortSignal?: AbortSignal;
}

/**
 * Runs the analytics engineer agent in the CLI without sandbox
 * The agent runs locally but uses the proxy model to route LLM calls through the server
 * Messages are written to disk after each step - the CLI polls the file for updates
 */
export async function runAnalyticsEngineerAgent(params: RunAnalyticsEngineerAgentParams) {
  const { chatId, workingDirectory, onThinkingStateChange, abortSignal } = params;

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
    modelId: 'anthropic/claude-4-sonnet-20250514',
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
    model: proxyModel,
    abortSignal,
    skipTracing: true, // Skip Braintrust tracing in CLI mode
  });

  // Use conversation history - includes user messages, assistant messages, tool calls, and tool results
  const messages: ModelMessage[] = previousMessages;

  // Start the stream - this triggers the agent to run
  const stream = await analyticsEngineerAgent.stream({ messages });

  // Notify thinking state
  onThinkingStateChange?.(true);

  // Track messages as we build them from stream parts
  let conversationMessages = [...messages]; // Start with conversation history
  let currentAssistantMessage: any = null;

  // Consume the stream and build messages
  for await (const part of stream.fullStream) {
    if (part.type === 'start-step') {
      // Start building a new assistant message for this step
      currentAssistantMessage = {
        role: 'assistant',
        toolInvocations: [],
      };
    } else if (part.type === 'tool-call') {
      // Add tool call to current assistant message
      if (currentAssistantMessage) {
        currentAssistantMessage.toolInvocations.push({
          state: 'call',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          args: part.input,
        });
      }
    } else if (part.type === 'tool-result') {
      // Update tool invocation with result
      if (currentAssistantMessage) {
        const invocation = currentAssistantMessage.toolInvocations.find(
          (inv: any) => inv.toolCallId === part.toolCallId
        );
        if (invocation) {
          invocation.state = 'result';
          invocation.result = part.output;
        }
      }
    } else if (part.type === 'finish-step') {
      // Step complete - add assistant message to conversation and save
      if (currentAssistantMessage && currentAssistantMessage.toolInvocations.length > 0) {
        conversationMessages = [...conversationMessages, currentAssistantMessage];
        await saveModelMessages(chatId, workingDirectory, conversationMessages);
      }
      currentAssistantMessage = null;
    } else if (part.type === 'finish') {
      onThinkingStateChange?.(false);
    }
  }
}
