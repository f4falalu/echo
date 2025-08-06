import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDocsAgentSystemPrompt } from './get-docs-agent-system-prompt';

describe('Docs Agent Instructions', () => {
  it('should validate template file contains expected variables', () => {
    const promptPath = path.join(__dirname, 'docs-agent-prompt.txt');
    const content = fs.readFileSync(promptPath, 'utf-8');

    // Expected template variables
    const expectedVariables = ['folder_structure', 'date'];

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
    const folderStructure = `
- src/
  - models/
    - users.yml
    - orders.yml
`;
    const result = getDocsAgentSystemPrompt(folderStructure);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);

    // Should contain the folder structure we provided
    expect(result).toContain(folderStructure);

    // Should not contain any unreplaced template variables
    expect(result).not.toMatch(/\{\{folder_structure\}\}/);
    expect(result).not.toMatch(/\{\{date\}\}/);

    // Should contain a valid ISO date string
    const isoDatePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    expect(result).toMatch(isoDatePattern);
  });

  it('should contain expected sections from the prompt template', () => {
    const result = getDocsAgentSystemPrompt('Test folder structure');

    // Check for key sections that should be in the prompt
    expect(result).toContain('<intro>');
    expect(result).toContain('<event_stream>');
    expect(result).toContain('<agent_loop>');
    expect(result).toContain('<tools>');
    expect(result).toContain('<repository_structure>');
    expect(result).toContain('<system_limitations>');
    expect(result).toContain('You are Buster');
  });

  it('should throw an error for empty folder structure', () => {
    expect(() => {
      getDocsAgentSystemPrompt('');
    }).toThrow('Folder structure is required');

    expect(() => {
      getDocsAgentSystemPrompt('   '); // whitespace only
    }).toThrow('Folder structure is required');
  });
});
