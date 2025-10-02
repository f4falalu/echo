import docsAgentPrompt from './docs-agent-prompt.txt';

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
  return docsAgentPrompt
    .replace(/\{\{folder_structure\}\}/g, params.folderStructure)
    .replace(/\{\{date\}\}/g, params.date);
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
