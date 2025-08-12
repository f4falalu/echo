import metricToolDescription from './metric-tool-description.txt';

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
function loadAndProcessPrompt(sqlDialectGuidance: string): string {
  if (!sqlDialectGuidance.trim()) {
    throw new Error('SQL dialect guidance is required');
  }

  // Replace template variables
  const currentDate = new Date().toISOString().split('T')[0] ?? '';
  const processedContent = metricToolDescription
    .replace(/\{\{sql_dialect_guidance\}\}/g, sqlDialectGuidance)
    .replace(/\{\{date\}\}/g, currentDate);

  return processedContent;
}

/**
 * Export the template function for use in metric tool
 */
export const getMetricToolDescription = (): string => {
  return metricToolDescription;
};

/**
 * Export the template function with parameters for use in metric tool
 */
export const getMetricToolDescriptionPrompt = (sqlDialectGuidance: string): string => {
  return loadAndProcessPrompt(sqlDialectGuidance);
};
