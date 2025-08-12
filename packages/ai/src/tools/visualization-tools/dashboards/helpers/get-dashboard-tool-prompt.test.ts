import { describe, expect, it } from 'vitest';
import dashboardToolDescription from './dashboard-tool-description.txt';
import { getDashboardToolDescription } from './get-dashboard-tool-description';

describe('Dashboard Tool Prompt Instructions', () => {
  it('should validate template file has no template variables', () => {
    const content = dashboardToolDescription;

    // Find any template variables in the file
    const templateVariablePattern = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();

    const matches = Array.from(content.matchAll(templateVariablePattern));
    for (const match of matches) {
      if (match[1] && match[1] !== 'variable') {
        foundVariables.add(match[1]);
      }
    }

    // Should have no template variables since this tool just fetches the raw content
    expect(foundVariables.size).toBe(0);
    expect(content.length).toBeGreaterThan(0);
  });

  it('should load the dashboard tool description correctly', () => {
    const result = getDashboardToolDescription();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // Should return the raw content from the text file
    expect(result).toBe(dashboardToolDescription);
  });

  it('should contain expected sections from the dashboard description', () => {
    const result = getDashboardToolDescription();

    // Check for key sections that should be in the dashboard description
    expect(result).toContain('Creates dashboard configuration files');
    expect(result).toContain('COMPLETE DASHBOARD YAML SCHEMA');
    expect(result).toContain('DASHBOARD CONFIGURATION - YML STRUCTURE');
    expect(result).toContain('Required fields:');
    expect(result).toContain('Rules:');
  });
});
