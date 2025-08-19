import { describe, expect, it } from 'vitest';
import dashboardToolDescription from './dashboard-tool-description.txt';
import { getDashboardToolDescription } from './get-dashboard-tool-description';

describe('getDashboardToolDescription', () => {
  it('should return the dashboard tool description from the .txt file', () => {
    const description = getDashboardToolDescription();

    // Verify it returns a non-empty string
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);

    // Verify it contains the expected content from the actual .txt file
    expect(description).toContain('Creates dashboard configuration files');
    expect(description).toContain('COMPLETE DASHBOARD YAML SCHEMA');
    expect(description).toContain('DASHBOARD CONFIGURATION - YML STRUCTURE');
  });

  it('should have no template variables in the .txt file', () => {
    const content = dashboardToolDescription;

    // Find any template variables in the file
    const templateVariablePattern = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();

    const matches = Array.from(content.matchAll(templateVariablePattern));
    for (const match of matches) {
      if (match[1]) {
        foundVariables.add(match[1]);
      }
    }

    // Should have no template variables since this tool just returns the raw content
    expect(foundVariables.size).toBe(0);

    // If any variables are found, list them for debugging
    if (foundVariables.size > 0) {
      console.error('Found unexpected template variables:', Array.from(foundVariables));
    }
  });
});
