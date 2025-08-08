import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Template parameters for the dashboard tool prompt
 */
export interface DashboardToolTemplateParams {
  dataSourceSyntax: string;
  date: string;
}

/**
 * Loads the dashboard tool prompt template and replaces variables
 */
function loadAndProcessPrompt(): string {
  const promptPath = path.join(__dirname, 'dashboard-tool-description.txt');

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');

    return content;
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
}

/**
 * Export the template function for use in dashboard tool
 */
export const getDashboardToolDescription = (): string => {
  return loadAndProcessPrompt();
};
