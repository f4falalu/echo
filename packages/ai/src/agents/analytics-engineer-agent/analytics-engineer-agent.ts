import { type ModelMessage, hasToolCall, stepCountIs, streamText } from 'ai';
import {
  DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
  DEFAULT_ANTHROPIC_OPTIONS,
} from '../../llm/providers/gateway';
import { Sonnet4 } from '../../llm/sonnet-4';
import { IDLE_TOOL_NAME } from '../../tools/communication-tools/idle-tool/idle-tool';
import { createAnalyticsEngineerToolset } from './create-analytics-engineer-toolset';
import { getDocsAgentSystemPrompt as getAnalyticsEngineerAgentSystemPrompt } from './get-analytics-engineer-agent-system-prompt';
import type {
  AnalyticsEngineerAgentOptions,
  AnalyticsEngineerAgentStreamOptions,
  TodoItem,
} from './types';

export const ANALYST_ENGINEER_AGENT_NAME = 'analyticsEngineerAgent';

const STOP_CONDITIONS = [stepCountIs(100), hasToolCall(IDLE_TOOL_NAME)];

export function createAnalyticsEngineerAgent(
  analyticsEngineerAgentOptions: AnalyticsEngineerAgentOptions
) {
  const systemMessage = {
    role: 'system',
    content: getAnalyticsEngineerAgentSystemPrompt(analyticsEngineerAgentOptions.folder_structure),
    providerOptions: DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
  } as ModelMessage;

  async function stream({ messages }: AnalyticsEngineerAgentStreamOptions) {
    const toolSet = await createAnalyticsEngineerToolset(analyticsEngineerAgentOptions);

    const streamFn = () =>
      streamText({
        model: analyticsEngineerAgentOptions.model || Sonnet4,
        providerOptions: DEFAULT_ANALYTICS_ENGINEER_OPTIONS,
        tools: toolSet,
        messages: [systemMessage, ...messages],
        stopWhen: STOP_CONDITIONS,
        maxOutputTokens: 64000,
        // temperature: 0,
      });

    return streamFn();
  }

  return {
    stream,
  };
}
