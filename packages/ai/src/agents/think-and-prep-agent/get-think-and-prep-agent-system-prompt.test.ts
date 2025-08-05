import { describe, it, expect } from 'vitest';
import { getThinkAndPrepAgentSystemPrompt } from './get-think-and-prep-agent-system-prompt';

describe('getThinkAndPrepAgentSystemPrompt', () => {
  it('should return system prompt with SQL dialect guidance', () => {
    const sqlDialectGuidance = 'PostgreSQL specific guidance';
    const result = getThinkAndPrepAgentSystemPrompt(sqlDialectGuidance);

    expect(result).toContain('You are Buster, a specialized AI agent');
    expect(result).toContain('PostgreSQL specific guidance');
    expect(result).toContain("Today's date is");
  });

  it('should include all necessary sections', () => {
    const sqlDialectGuidance = 'MySQL specific guidance';
    const result = getThinkAndPrepAgentSystemPrompt(sqlDialectGuidance);

    // Check for key sections
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
  });
});