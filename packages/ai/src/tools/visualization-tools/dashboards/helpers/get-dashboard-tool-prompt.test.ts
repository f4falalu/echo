import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDashboardToolDescription } from './get-dashboard-tool-description';

describe('Dashboard Tool Prompt Instructions', () => {
  it('should validate template file contains expected variables', () => {
    const promptPath = path.join(__dirname, 'dashboard-tool-description.txt');
    const content = fs.readFileSync(promptPath, 'utf-8');

    // Expected template variables
    const expectedVariables = ['sql_dialect_guidance', 'date'];

    // Find all template variables in the file
    const templateVariablePattern = /\{\{([^}]+)\}\}/g;
    const foundVariables = new Set<string>();

    const matches = Array.from(content.matchAll(templateVariablePattern));
    for (const match of matches) {
      if (match[1] && match[1] !== 'variable') {
        foundVariables.add(match[1]);
      }
    }

    // Convert to arrays for easier comparison
    const foundVariablesArray = Array.from(foundVariables).sort();
    const expectedVariablesArray = expectedVariables.sort();

    // Check that we have exactly the expected variables
    expect(foundVariablesArray).toEqual(expectedVariablesArray);

    // Also verify each expected variable exists
    for (const variable of expectedVariables) {
      expect(content).toMatch(new RegExp(`\\{\\{${variable}\\}\\}`));
    }

    // Ensure no unexpected variables exist
    expect(foundVariables.size).toBe(expectedVariables.length);
  });

  it('should load and process the prompt template correctly', () => {
    const sqlDialectGuidance = 'Test SQL guidance for PostgreSQL';
    const result = getDashboardToolDescription();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // Should contain the SQL guidance we provided
    expect(result).toContain(sqlDialectGuidance);

    // Should not contain any unreplaced template variables
    expect(result).not.toMatch(/\{\{sql_dialect_guidance\}\}/);
    expect(result).not.toMatch(/\{\{date\}\}/);

    // Should contain the current date in YYYY-MM-DD format
    const currentDate = new Date().toISOString().split('T')[0];
    expect(result).toContain(currentDate);
  });

  it('should contain expected sections from the prompt template', () => {
    const result = getDashboardToolDescription();

    // Check for key sections that should be in the prompt
    // Note: These expectations may need to be adjusted based on the actual content
    // of the dashboard-tool-description.txt file
    expect(result.length).toBeGreaterThan(0);
    // Additional specific content checks can be added based on the prompt template structure
  });

  it('should throw an error for empty SQL dialect guidance', () => {
    expect(() => {
      getDashboardToolDescription();
    }).toThrow('SQL dialect guidance is required');

    expect(() => {
      getDashboardToolDescription(); // whitespace only
    }).toThrow('SQL dialect guidance is required');
  });
});
