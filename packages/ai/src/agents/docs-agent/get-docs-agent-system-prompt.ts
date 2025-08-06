import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Template parameters for the docs agent prompt
 */
export interface DocsAgentTemplateParams {
  folderStructure: string;
  date: string;
}

/**
 * Loads the docs agent prompt template and replaces variables
 */
function loadAndProcessPrompt(params: DocsAgentTemplateParams): string {
  const promptPath = path.join(__dirname, 'docs-agent-prompt.txt');

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');

    return content
      .replace(/\{\{folder_structure\}\}/g, params.folderStructure)
      .replace(/\{\{date\}\}/g, params.date);
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
}

/**
 * Export the template function for use in agent files
 */
export const getDocsAgentSystemPrompt = (folderStructure: string): string => {
  if (!folderStructure.trim()) {
    throw new Error('Folder structure is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt({
    folderStructure,
    date: currentDate,
  });
};
