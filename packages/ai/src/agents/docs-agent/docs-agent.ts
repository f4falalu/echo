import {} from '@ai-sdk/anthropic';
import { Agent } from '@mastra/core';
import {
  bashExecute,
  checkOffTodoList,
  createFiles,
  deleteFiles,
  editFiles,
  grepSearch,
  idleTool,
  readFiles,
  sequentialThinking,
  updateClarificationsFile,
  webSearch,
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

export const analystAgent = new Agent({
  name: 'Docs Agent',
  instructions: '', // We control the system messages in the step at stream instantiation
  model: Sonnet4,
  tools: {
    // TODO: missing execute sql
    sequentialThinking,
    grepSearch,
    readFiles,
    editFiles,
    createFiles,
    deleteFiles,
    bashExecute,
    updateClarificationsFile,
    checkOffTodoList,
    idleTool,
    webSearch,
  },
  defaultGenerateOptions: DEFAULT_OPTIONS,
  defaultStreamOptions: DEFAULT_OPTIONS,
});
