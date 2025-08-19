import { describe, expect, it } from 'vitest';
import createTodosSystemPrompt from './create-todos-system-prompt.txt';
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

  it('should validate prompt file is loaded', () => {
    expect(createTodosSystemPrompt).toBeDefined();
    expect(typeof createTodosSystemPrompt).toBe('string');
    expect(createTodosSystemPrompt.length).toBeGreaterThan(0);
  });

  it('should not contain any template variables', () => {
    const result = getCreateTodosSystemMessage();

    // Check that there are no unreplaced template variables
    const templateVariablePattern = /\{\{[^}]+\}\}/g;
    const matches = result.match(templateVariablePattern);

    expect(matches).toBeNull();
  });
});
