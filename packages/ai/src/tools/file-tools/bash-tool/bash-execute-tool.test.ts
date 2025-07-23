import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { executeBash } from './bash-execute-tool';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

vi.mock('./bash-execute-functions', () => ({
  generateBashExecuteCode: vi.fn(),
  executeBashCommandsSafely: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';
import { executeBashCommandsSafely, generateBashExecuteCode } from './bash-execute-functions';

const mockRunTypescript = vi.mocked(runTypescript);
const mockGenerateBashExecuteCode = vi.mocked(generateBashExecuteCode);
const mockExecuteBashCommandsSafely = vi.mocked(executeBashCommandsSafely);

describe('bash-execute-tool', () => {
  let runtimeContext: RuntimeContext<DocsAgentContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext<DocsAgentContext>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('bashExecute tool', () => {
    it('should have correct tool configuration', () => {
      expect(executeBash.id).toBe('execute-bash');
      expect(executeBash.description).toContain('Executes bash commands');
      expect(executeBash.inputSchema).toBeDefined();
      expect(executeBash.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        commands: [
          { command: 'echo "hello"', description: 'test command' },
          { command: 'ls -la', timeout: 5000 },
        ],
      };

      expect(() => executeBash.inputSchema.parse(validInput)).not.toThrow();
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: JSON.stringify([
          {
            command: 'echo "hello"',
            stdout: 'hello',
            stderr: undefined,
            exitCode: 0,
            success: true,
            error: undefined,
          },
        ]),
        exitCode: 0,
        stderr: '',
      };

      mockGenerateBashExecuteCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(mockGenerateBashExecuteCode).toHaveBeenCalledWith(input.commands);
      expect(mockRunTypescript).toHaveBeenCalledWith(mockSandbox, mockCode);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        command: 'echo "hello"',
        stdout: 'hello',
        stderr: undefined,
        exitCode: 0,
        success: true,
        error: undefined,
      });
    });

    it('should fallback to local execution when sandbox not available', async () => {
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

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(mockExecuteBashCommandsSafely).toHaveBeenCalledWith(input.commands);
      expect(result.results).toEqual(mockLocalResults);
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

      mockGenerateBashExecuteCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        command: 'echo "hello"',
        stdout: '',
        stderr: undefined,
        exitCode: 1,
        success: false,
        error: 'Execution error: Sandbox execution failed: Execution failed',
      });
    });

    it('should handle execution errors', async () => {
      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      mockExecuteBashCommandsSafely.mockRejectedValue(new Error('Execution failed'));

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toContain('Execution error');
    });

    it('should handle empty commands array', async () => {
      const input = { commands: [] };

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(0);
    });

    it('should handle JSON parse errors from sandbox', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

      mockGenerateBashExecuteCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        command: 'echo "hello"',
        stdout: '',
        stderr: undefined,
        exitCode: 1,
        success: false,
        error: expect.stringContaining('Failed to parse sandbox output'),
      });
    });
  });
});
