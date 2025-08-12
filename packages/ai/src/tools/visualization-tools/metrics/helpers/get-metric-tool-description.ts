import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Template parameters for the metric tool description prompt
 */
export interface MetricToolTemplateParams {
  dataSourceSyntax: string;
  date: string;
}

// Cache the prompt content to avoid repeated file reads
let cachedPrompt: string | null = null;

// Get the prompt content, with caching
const getPromptContent = (): string => {
  if (cachedPrompt) {
    return cachedPrompt;
  }

  // Try multiple possible locations for the prompt file
  const possiblePaths = [
    // Source location (for tests)
    path.join(__dirname, 'metric-tool-description.txt'),
    // Alternative source location
    path.join(__dirname, '..', 'helpers', 'metric-tool-description.txt'),
    // Compiled location
    path.join(
      process.cwd(),
      'packages/ai/dist/tools/visualization-tools/metrics/helpers/metric-tool-description.txt'
    ),
    // Direct source path from project root
    path.join(
      process.cwd(),
      'packages/ai/src/tools/visualization-tools/metrics/helpers/metric-tool-description.txt'
    ),
  ];

  for (const promptPath of possiblePaths) {
    try {
      cachedPrompt = fs.readFileSync(promptPath, 'utf-8');
      return cachedPrompt;
    } catch {
      // Try next path
    }
  }

  throw new Error('Failed to load metric tool description prompt from any location');
};

/**
 * Loads the metric tool description prompt template and replaces variables
 */
function loadAndProcessPrompt(sqlDialectGuidance: string): string {
  if (!sqlDialectGuidance.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  try {
    const content = getPromptContent();

    // Replace template variables
    const currentDate = new Date().toISOString().split('T')[0] ?? '';
    const processedContent = content
      .replace(/\{\{sql_dialect_guidance\}\}/g, sqlDialectGuidance)
      .replace(/\{\{date\}\}/g, currentDate);

    return processedContent;
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
}

/**
 * Export the template function for use in metric tool
 */
export const getMetricToolDescription = (): string => {
  try {
    return getPromptContent();
  } catch (error) {
    throw new Error(`Failed to load prompt template: ${String(error)}`);
  }
};

/**
 * Export the template function with parameters for use in metric tool
 */
export const getMetricToolDescriptionPrompt = (sqlDialectGuidance: string): string => {
  return loadAndProcessPrompt(sqlDialectGuidance);
};
