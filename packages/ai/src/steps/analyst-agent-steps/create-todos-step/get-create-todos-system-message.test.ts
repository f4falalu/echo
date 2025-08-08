import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getCreateTodosSystemMessage } from './get-create-todos-system-message';

describe('Create Todos System Message', () => {
  it('should load the prompt template correctly', () => {
    const result = getCreateTodosSystemMessage();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should contain expected sections from the prompt template', () => {
    const result = getCreateTodosSystemMessage();

    // Check for key sections that should be in the prompt
    expect(result).toContain('### Overview');
    expect(result).toContain('### Identifying Conditions and Questions');
    expect(result).toContain('### Instructions');
    expect(result).toContain('### Examples');
    expect(result).toContain('### System Limitations');
    expect(result).toContain('### Best Practices');
    expect(result).toContain('### Privacy and Security');
    expect(result).toContain('prep mode');
    expect(result).toContain('TODO list');
  });

  it('should contain specific examples from the prompt', () => {
    const result = getCreateTodosSystemMessage();

    // Check for some specific examples that should be in the prompt
    expect(result).toContain('Baltic Born');
    expect(result).toContain('how many customers do we have');
    expect(result).toContain('30 biggest merchants');
    expect(result).toContain('Determine how');
    expect(result).toContain('[ ]'); // Checkbox format
  });

  it('should validate prompt file exists and is readable', () => {
    const promptPath = path.join(__dirname, 'create-todos-system-prompt.txt');

    expect(() => {
      fs.accessSync(promptPath, fs.constants.R_OK);
    }).not.toThrow();

    const stats = fs.statSync(promptPath);
    expect(stats.isFile()).toBe(true);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('should not contain any template variables', () => {
    const result = getCreateTodosSystemMessage();

    // Check that there are no unreplaced template variables
    const templateVariablePattern = /\{\{[^}]+\}\}/g;
    const matches = result.match(templateVariablePattern);

    expect(matches).toBeNull();
  });
});
