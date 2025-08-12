import { describe, expect, it } from 'vitest';
import createDocsTodosSystemPrompt from './create-docs-todos-system-prompt.txt';
import { getCreateDocsTodosSystemMessage } from './get-create-docs-todos-system-message';

describe('Create Docs Todos System Message', () => {
  it('should load the prompt template correctly', () => {
    const result = getCreateDocsTodosSystemMessage();

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should contain expected sections from the prompt template', () => {
    const result = getCreateDocsTodosSystemMessage();

    // Check for key sections that should be in the prompt
    expect(result).toContain('### Overview');
    expect(result).toContain('### Repository Structure Guidelines');
    expect(result).toContain('### Instructions');
    expect(result).toContain('### Examples');
    expect(result).toContain('Documentation Agent');
    expect(result).toContain('TODO list');
    expect(result).toContain('dbt repositories');
  });

  it('should contain specific examples from the prompt', () => {
    const result = getCreateDocsTodosSystemMessage();

    // Check for some specific examples that should be in the prompt
    expect(result).toContain('DBT Documentation Todo');
    expect(result).toContain('customers');
    expect(result).toContain('HubSpot');
    expect(result).toContain('Phase 1:');
    expect(result).toContain('Phase 2:');
    expect(result).toContain('[ ]'); // Checkbox format
    expect(result).toContain('.yml files');
    expect(result).toContain('.sql files');
  });

  it('should validate prompt file is loaded', () => {
    expect(createDocsTodosSystemPrompt).toBeDefined();
    expect(typeof createDocsTodosSystemPrompt).toBe('string');
    expect(createDocsTodosSystemPrompt.length).toBeGreaterThan(0);
  });

  it('should not contain any template variables', () => {
    const result = getCreateDocsTodosSystemMessage();

    // Check that there are no unreplaced template variables
    const templateVariablePattern = /\{\{[^}]+\}\}/g;
    const matches = result.match(templateVariablePattern);

    expect(matches).toBeNull();
  });

  it('should contain documentation-specific instructions', () => {
    const result = getCreateDocsTodosSystemMessage();

    // Check for documentation-specific content
    expect(result).toContain('data catalog');
    expect(result).toContain('model documentation');
    expect(result).toContain('relationships');
    expect(result).toContain('pull request');
    expect(result).toContain('Stored Value');
    expect(result).toContain('ENUM');
  });
});
