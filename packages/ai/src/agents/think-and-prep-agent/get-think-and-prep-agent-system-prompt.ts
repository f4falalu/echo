import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Template parameters for the think and prep agent prompt
 */
export interface ThinkAndPrepTemplateParams {
  sqlDialectGuidance: string;
  date: string;
}

/**
 * Loads the think and prep agent prompt template and replaces variables
 */
function loadAndProcessPrompt(params: ThinkAndPrepTemplateParams): string {
  const promptPath = path.join(__dirname, 'think-and-prep-agent-prompt.txt');

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');

    return content
      .replace(/\{\{sql_dialect_guidance\}\}/g, params.sqlDialectGuidance)
      .replace(/\{\{date\}\}/g, params.date);
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
}

/**
 * Export the template function for use in step files
 */
export const getThinkAndPrepAgentSystemPrompt = (sqlDialectGuidance: string): string => {
  if (!sqlDialectGuidance.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt({
    sqlDialectGuidance,
    date: currentDate,
  });
};
