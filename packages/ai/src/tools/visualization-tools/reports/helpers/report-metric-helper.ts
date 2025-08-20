/**
 * Helper function to check if a report contains metric references
 * Looks for patterns like: <metric metricId="UUID" />
 */
export function reportContainsMetrics(content: string | undefined): boolean {
  if (!content) {
    return false;
  }

  // Pattern to match metric tags with IDs
  // Matches: <metric metricId="UUID" /> or variations with different spacing/quotes
  const metricPattern = /<metric\s+metricId\s*=\s*["'][a-f0-9-]+["']\s*\/>/i;

  return metricPattern.test(content);
}

/**
 * Extract metric IDs from report content
 * Returns array of metric IDs found in the report
 */
export function extractMetricIdsFromReport(content: string | undefined): string[] {
  if (!content) {
    return [];
  }

  const metricIds: string[] = [];
  // Pattern to extract metric IDs - captures the UUID
  const metricIdPattern = /<metric\s+metricId\s*=\s*["']([a-f0-9-]+)["']\s*\/>/gi;
  const matches = content.matchAll(metricIdPattern);

  for (const match of matches) {
    if (match[1]) {
      metricIds.push(match[1]);
    }
  }

  return metricIds;
}
