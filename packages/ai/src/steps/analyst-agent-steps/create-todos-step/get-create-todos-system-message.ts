import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Loads the create todos prompt template
 */
function loadPrompt(): string {
  const promptPath = path.join(__dirname, 'create-todos-system-prompt.txt');

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
}

/**
 * Export the template function for use in step files
 */
export const getCreateTodosSystemMessage = (): string => {
  return loadPrompt();
};
