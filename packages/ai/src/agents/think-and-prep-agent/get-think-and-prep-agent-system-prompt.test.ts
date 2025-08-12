import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getThinkAndPrepAgentSystemPrompt } from './get-think-and-prep-agent-system-prompt';

describe('Think and Prep Agent Instructions', () => {
  describe.each([
    ['standard', 'think-and-prep-agent-standard-prompt.txt'],
    ['investigation', 'think-and-prep-agent-investigation-prompt.txt'],
  ])('%s mode', (mode, filename) => {
    it(`should validate ${mode} template file contains expected variables`, () => {
      const promptPath = path.join(__dirname, filename);
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
  });

  describe('Standard mode', () => {
    it('should load and process the standard prompt template correctly', () => {
      const sqlDialectGuidance = 'Test SQL guidance for PostgreSQL';
      const result = getThinkAndPrepAgentSystemPrompt(sqlDialectGuidance);

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

    it('should load standard mode when explicitly specified', () => {
      const sqlDialectGuidance = 'Test SQL guidance for PostgreSQL';
      const result = getThinkAndPrepAgentSystemPrompt(sqlDialectGuidance, 'standard');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain(sqlDialectGuidance);
    });
  });

  describe('Investigation mode', () => {
    it('should load and process the investigation prompt template correctly', () => {
      const sqlDialectGuidance = 'Test SQL guidance for PostgreSQL';
      const result = getThinkAndPrepAgentSystemPrompt(sqlDialectGuidance, 'investigation');

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
  });

  describe('Expected sections', () => {
    it('should contain expected sections from the standard prompt template', () => {
      const result = getThinkAndPrepAgentSystemPrompt('Test guidance', 'standard');

      // Check for key sections that should be in the standard prompt
      expect(result).toContain('<intro>');
      expect(result).toContain('<prep_mode_capability>');
      expect(result).toContain('<event_stream>');
      expect(result).toContain('<agent_loop>');
      expect(result).toContain('<todo_list>');
      expect(result).toContain('<todo_rules>');
      expect(result).toContain('<tool_use_rules>');
      expect(result).toContain('<sequential_thinking_rules>');
      expect(result).toContain('<execute_sql_rules>');
      expect(result).toContain('<sql_best_practices>');
      expect(result).toContain('<visualization_and_charting_guidelines>');
      expect(result).toContain('You are Buster');
    });

    it('should contain expected sections from the investigation prompt template', () => {
      const result = getThinkAndPrepAgentSystemPrompt('Test guidance', 'investigation');

      // Check for key sections that should be in the investigation prompt
      expect(result).toContain('<intro>');
      expect(result).toContain('<prep_mode_capability>');
      expect(result).toContain('<event_stream>');
      expect(result).toContain('<agent_loop>');
      expect(result).toContain('<todo_list>');
      expect(result).toContain('<todo_rules>');
      expect(result).toContain('<tool_use_rules>');
      expect(result).toContain('<sequential_thinking_rules>');
      expect(result).toContain('<execute_sql_rules>');
      expect(result).toContain('<sql_best_practices>');
      expect(result).toContain('<visualization_and_charting_guidelines>');
      expect(result).toContain('You are Buster');
      // Investigation-specific content
      expect(result).toContain('data researcher');
    });
  });

  it('should throw an error for empty SQL dialect guidance', () => {
    expect(() => {
      getThinkAndPrepAgentSystemPrompt('');
    }).toThrow('SQL dialect guidance is required');

    expect(() => {
      getThinkAndPrepAgentSystemPrompt('   '); // whitespace only
    }).toThrow('SQL dialect guidance is required');
  });
});
