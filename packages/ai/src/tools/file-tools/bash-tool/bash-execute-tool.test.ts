import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { executeBash } from './bash-execute-tool';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';

const mockRunTypescript = vi.mocked(runTypescript);
const mockReadFile = vi.mocked(fs.readFile);

describe('bash-execute-tool', () => {
  let runtimeContext: RuntimeContext<DocsAgentContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext<DocsAgentContext>();

    // Mock the script content
    mockReadFile.mockResolvedValue('mock script content');
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

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(mockReadFile).toHaveBeenCalledWith(
        path.join(__dirname, 'bash-execute-script.ts'),
        'utf-8'
      );
      expect(mockRunTypescript).toHaveBeenCalledWith(mockSandbox, 'mock script content', {
        argv: [JSON.stringify(input.commands)],
      });
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

    it('should return error when sandbox not available', async () => {
      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

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
        error: 'Bash execution requires sandbox environment',
      });
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

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

    it('should handle error response from script', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      // When the script itself fails, it outputs an error JSON
      const mockSandboxResult = {
        result: '',
        exitCode: 1,
        stderr: JSON.stringify({
          success: false,
          error: 'Custom error from script',
        }),
      };

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
        error:
          'Execution error: Sandbox execution failed: {"success":false,"error":"Custom error from script"}',
      });
    });

    it('should handle file read errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [{ command: 'echo "hello"' }],
      };

      mockReadFile.mockRejectedValue(new Error('File read failed'));

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toContain('File read failed');
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

      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

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

    it('should handle multiple commands', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        commands: [
          { command: 'echo "first"', description: 'First command' },
          { command: 'echo "second"', timeout: 1000 },
          { command: 'ls -la' },
        ],
      };

      const mockSandboxResult = {
        result: JSON.stringify([
          {
            command: 'echo "first"',
            stdout: 'first',
            exitCode: 0,
            success: true,
          },
          {
            command: 'echo "second"',
            stdout: 'second',
            exitCode: 0,
            success: true,
          },
          {
            command: 'ls -la',
            stdout: 'file list output',
            exitCode: 0,
            success: true,
          },
        ]),
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await executeBash.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0].stdout).toBe('first');
      expect(result.results[1].stdout).toBe('second');
      expect(result.results[2].stdout).toBe('file list output');
    });
  });
});
