import analystAgentPrompt from './analyst-agent-prompt.txt';

/**
 * Template parameters for the analyst agent prompt
 */
export interface AnalystTemplateParams {
  dataSourceSyntax: string;
  date: string;
}

/**
 * Loads the analyst agent prompt template and replaces variables
 */
function loadAndProcessPrompt(params: AnalystTemplateParams): string {
  return analystAgentPrompt
    .replace(/\{\{sql_dialect_guidance\}\}/g, params.dataSourceSyntax)
    .replace(/\{\{date\}\}/g, params.date);
}

/**
 * Export the template function for use in step files
 */
export const getAnalystAgentSystemPrompt = (dataSourceSyntax: string): string => {
  if (!dataSourceSyntax.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt({
    dataSourceSyntax,
    date: currentDate,
  });
};
