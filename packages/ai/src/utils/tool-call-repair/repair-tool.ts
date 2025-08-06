import type { LanguageModelV2ToolCall } from '@ai-sdk/provider';
import { InvalidToolInputError, NoSuchToolError, type ToolSet } from 'ai';
import type { z } from 'zod';
import { healToolWithLlm } from './heal-tool-with-llm';

export const repairToolCall = async ({
  toolCall,
  tools,
  error,
}: {
  toolCall: LanguageModelV2ToolCall;
  tools: ToolSet;
  error: NoSuchToolError | InvalidToolInputError;
}) => {
  if (error instanceof NoSuchToolError) {
    return null; // TODO: Implement repair tool response for unknown tools
  }

  if (error instanceof InvalidToolInputError) {
    return healToolWithLlm({ toolCall, tools });
  }

  return null; // TODO: Generic error handling try again?
};
