import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type DocsAgentContext, DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { deleteFiles } from './delete-files-tool';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';

const mockRunTypescript = vi.mocked(runTypescript);
const mockReadFile = vi.mocked(fs.readFile);

describe('delete-files-tool', () => {
  let runtimeContext: RuntimeContext<DocsAgentContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext<DocsAgentContext>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('deleteFiles tool', () => {
    it('should have correct tool configuration', () => {
      expect(deleteFiles.id).toBe('delete-files');
      expect(deleteFiles.description).toContain('Deletes files at the specified paths');
      expect(deleteFiles.inputSchema).toBeDefined();
      expect(deleteFiles.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        paths: ['/test/file1.txt', '/test/file2.txt'],
      };

      expect(() => deleteFiles.inputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input schema', () => {
      const invalidInput = {
        paths: [123, 456], // Should be strings
      };

      expect(() => deleteFiles.inputSchema.parse(invalidInput)).toThrow();
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        paths: ['/test/file.txt'],
      };

      const mockScriptContent = 'mock script content';
      const mockSandboxResult = {
        result: JSON.stringify([{ success: true, path: '/test/file.txt' }]),
        exitCode: 0,
        stderr: '',
      };

      mockReadFile.mockResolvedValue(mockScriptContent);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(mockReadFile).toHaveBeenCalledWith(
        path.join(__dirname, 'delete-files-script.ts'),
        'utf-8'
      );
      expect(mockRunTypescript).toHaveBeenCalledWith(mockSandbox, mockScriptContent, {
        argv: input.paths,
      });
      expect(result.results).toEqual([
        {
          status: 'success',
          path: '/test/file.txt',
        },
      ]);
    });

    it('should return error when sandbox not available', async () => {
      const input = {
        paths: ['/test/file.txt'],
      };

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: 'File deletion requires sandbox environment',
        },
      ]);
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        paths: ['/test/file.txt'],
      };

      const mockScriptContent = 'mock script content';
      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

      mockReadFile.mockResolvedValue(mockScriptContent);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: 'Execution error: Sandbox execution failed: Execution failed',
        },
      ]);
    });

    it('should handle mixed success and error results', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        paths: ['/test/file1.txt', '/test/file2.txt'],
      };

      const mockScriptContent = 'mock script content';
      const mockSandboxResult = {
        result: JSON.stringify([
          { success: true, path: '/test/file1.txt' },
          { success: false, path: '/test/file2.txt', error: 'Permission denied' },
        ]),
        exitCode: 0,
        stderr: '',
      };

      mockReadFile.mockResolvedValue(mockScriptContent);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([
        {
          status: 'success',
          path: '/test/file1.txt',
        },
        {
          status: 'error',
          path: '/test/file2.txt',
          error_message: 'Permission denied',
        },
      ]);
    });

    it('should handle empty paths array', async () => {
      const input = { paths: [] };

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([]);
    });

    it('should handle JSON parse errors from sandbox', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        paths: ['/test/file.txt'],
      };

      const mockScriptContent = 'mock script content';
      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

      mockReadFile.mockResolvedValue(mockScriptContent);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: expect.stringContaining('Failed to parse sandbox output'),
        },
      ]);
    });

    it('should handle multiple files in parallel', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        paths: ['/test/file1.txt', '/test/file2.txt', '/test/file3.txt'],
      };

      const mockScriptContent = 'mock script content';
      const mockSandboxResult = {
        result: JSON.stringify([
          { success: true, path: '/test/file1.txt' },
          { success: true, path: '/test/file2.txt' },
          { success: true, path: '/test/file3.txt' },
        ]),
        exitCode: 0,
        stderr: '',
      };

      mockReadFile.mockResolvedValue(mockScriptContent);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([
        {
          status: 'success',
          path: '/test/file1.txt',
        },
        {
          status: 'success',
          path: '/test/file2.txt',
        },
        {
          status: 'success',
          path: '/test/file3.txt',
        },
      ]);
    });

    it('should handle file read errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox as any);

      const input = {
        paths: ['/test/file.txt'],
      };

      mockReadFile.mockRejectedValue(new Error('Failed to read script file'));

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: 'Execution error: Failed to read script file',
        },
      ]);
    });
  });
});
