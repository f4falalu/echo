import { Agent } from '@mastra/core';
import {
  executeSql,
  messageUserClarifyingQuestion,
  respondWithoutAnalysis,
  sequentialThinking,
  submitThoughts,
} from '../../tools';
import { Sonnet4 } from '../../utils/models/sonnet-4';

const DEFAULT_OPTIONS = {
  maxSteps: 18,
  temperature: 0,
  maxTokens: 10000,
  providerOptions: {
    anthropic: {
      disableParallelToolCalls: true,
    },
  },
};

export const thinkAndPrepAgent = new Agent({
  name: 'Think and Prep Agent',
  instructions: '', // We control the system messages in the step at stream instantiation
  model: Sonnet4,
  tools: {
    sequentialThinking,
    executeSql,
    respondWithoutAnalysis,
    submitThoughts,
    messageUserClarifyingQuestion,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
