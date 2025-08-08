import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Template parameters for the metric tool description prompt
 */
export interface MetricToolTemplateParams {
  dataSourceSyntax: string;
  date: string;
}

/**
 * Loads the metric tool description prompt template and replaces variables
 */
function loadAndProcessPrompt(): string {
  const promptPath = path.join(__dirname, 'create-metric-tool-prompt.txt');

  try {
    const content = fs.readFileSync(promptPath, 'utf-8');

    return content;
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
}

/**
 * Export the template function for use in metric tool
 */
export const getMetricToolDescription = (): string => {
  return loadAndProcessPrompt();
};
