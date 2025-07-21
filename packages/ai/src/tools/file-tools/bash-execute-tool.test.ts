import { describe, expect, it } from 'vitest';
import { bashExecute } from './bash-execute-tool';

describe('bash-execute-tool', () => {
  it('should have correct tool configuration', () => {
    expect(bashExecute.id).toBe('bash_execute');
    expect(bashExecute.description).toBe('Executes bash commands and captures stdout, stderr, and exit codes');
    expect(bashExecute.inputSchema).toBeDefined();
    expect(bashExecute.outputSchema).toBeDefined();
    expect(bashExecute.execute).toBeDefined();
  });

  it('should validate input schema for single command', () => {
    const singleCommandInput = {
      commands: {
        command: 'echo "hello"',
        description: 'Test command',
        timeout: 5000
      }
    };
    
    const result = bashExecute.inputSchema.safeParse(singleCommandInput);
    expect(result.success).toBe(true);
  });

  it('should validate input schema for array of commands', () => {
    const arrayCommandInput = {
      commands: [
        { command: 'echo "hello"' },
        { command: 'echo "world"', timeout: 1000 }
      ]
    };
    
    const result = bashExecute.inputSchema.safeParse(arrayCommandInput);
    expect(result.success).toBe(true);
  });

  it('should validate output schema structure', () => {
    const outputExample = {
      results: [
        {
          command: 'echo "test"',
          stdout: 'test',
          stderr: undefined,
          exitCode: 0,
          success: true,
          error: undefined
        }
      ]
    };
    
    const result = bashExecute.outputSchema.safeParse(outputExample);
    expect(result.success).toBe(true);
  });
});
