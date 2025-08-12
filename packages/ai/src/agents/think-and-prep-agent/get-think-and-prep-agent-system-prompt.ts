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
 * Analysis mode type
 */
export type AnalysisMode = 'standard' | 'investigation';

/**
 * Type-safe mapping of analysis modes to prompt file names
 */
const PROMPT_FILES: Record<AnalysisMode, string> = {
  standard: 'think-and-prep-agent-standard-prompt.txt',
  investigation: 'think-and-prep-agent-investigation-prompt.txt',
} as const;

/**
 * Loads the think and prep agent prompt template and replaces variables
 */
function loadAndProcessPrompt(
  params: ThinkAndPrepTemplateParams,
  analysisMode: AnalysisMode = 'standard'
): string {
  const promptFileName = PROMPT_FILES[analysisMode];
  const promptPath = path.join(__dirname, promptFileName);

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');

    return content
      .replace(/\{\{sql_dialect_guidance\}\}/g, params.sqlDialectGuidance)
      .replace(/\{\{date\}\}/g, params.date);
  } catch (error) {
    throw new Error(`Failed to load prompt template for ${analysisMode} mode: ${String(error)}`);
  }
}

/**
 * Export the template function for use in step files
 */
export const getThinkAndPrepAgentSystemPrompt = (
  sqlDialectGuidance: string,
  analysisMode: AnalysisMode = 'standard'
): string => {
  if (!sqlDialectGuidance.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  const currentDate = new Date().toISOString();

  return loadAndProcessPrompt(
    {
      sqlDialectGuidance,
      date: currentDate,
    },
    analysisMode
  );
};
