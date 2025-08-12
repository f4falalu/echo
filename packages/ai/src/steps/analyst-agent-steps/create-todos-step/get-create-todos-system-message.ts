import createTodosSystemPrompt from './create-todos-system-prompt.txt';

/**
 * Export the template function for use in step files
 */
export const getCreateTodosSystemMessage = (): string => {
  return createTodosSystemPrompt;
};
