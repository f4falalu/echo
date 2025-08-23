import createDocsTodosSystemPrompt from './create-docs-todos-system-prompt.txt';

/**
 * Export the template function for use in step files
 */
export const getCreateDocsTodosSystemMessage = (): string => {
  return createDocsTodosSystemPrompt;
};
