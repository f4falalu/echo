import type { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./bash-execute-functions', () => ({
  executeBashCommandsSafely: vi.fn(),
}));

import { executeBashCommandsSafely } from './bash-execute-functions';
import { bashExecute } from './bash-execute-tool';

const mockExecuteBashCommandsSafely = vi.mocked(executeBashCommandsSafely);

describe('bash-execute-tool', () => {
  let mockRuntimeContext: RuntimeContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRuntimeContext = {
      get: vi.fn(),
    } as any;
  });

  it('should execute commands locally', async () => {
    const input = {
      commands: [{ command: 'echo "hello"' }],
    };

    const mockLocalResults = [
      {
        command: 'echo "hello"',
        stdout: 'hello',
        stderr: undefined,
        exitCode: 0,
        success: true,
        error: undefined,
      },
    ];

    mockExecuteBashCommandsSafely.mockResolvedValue(mockLocalResults);

    const result = await bashExecute.execute({
      context: input,
      runtimeContext: mockRuntimeContext,
    });

    expect(mockExecuteBashCommandsSafely).toHaveBeenCalledWith(input.commands);
    expect(result.results).toEqual(mockLocalResults);
  });

  it('should handle execution errors', async () => {
    const input = {
      commands: [{ command: 'echo "hello"' }],
    };

    mockExecuteBashCommandsSafely.mockRejectedValue(new Error('Execution failed'));

    const result = await bashExecute.execute({
      context: input,
      runtimeContext: mockRuntimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.success).toBe(false);
    expect(result.results[0]?.error).toContain('Execution error');
  });

  it('should handle empty commands array', async () => {
    const input = { commands: [] };

    const result = await bashExecute.execute({
      context: input,
      runtimeContext: mockRuntimeContext,
    });

    expect(result.results).toHaveLength(0);
  });
});
