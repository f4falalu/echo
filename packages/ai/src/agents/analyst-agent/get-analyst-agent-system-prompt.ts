import * as fs from 'node:fs';
import * as path from 'node:path';

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
  const promptPath = path.join(__dirname, 'analyst-agent-prompt.txt');

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');

    return content
      .replace(/\{\{sql_dialect_guidance\}\}/g, params.dataSourceSyntax)
      .replace(/\{\{date\}\}/g, params.date);
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
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
