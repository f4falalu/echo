import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { type SandboxContext, SandboxContextKey } from '../../../context/sandbox-context';
import { deleteFiles } from './delete-files-tool';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

vi.mock('./delete-files-functions', () => ({
  generateFileDeleteCode: vi.fn(),
  deleteFilesSafely: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';
import { deleteFilesSafely, generateFileDeleteCode } from './delete-files-functions';

const mockRunTypescript = vi.mocked(runTypescript);
const mockGenerateFileDeleteCode = vi.mocked(generateFileDeleteCode);
const mockDeleteFilesSafely = vi.mocked(deleteFilesSafely);

describe('delete-files-tool', () => {
  let runtimeContext: RuntimeContext<SandboxContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext<SandboxContext>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('deleteFiles tool', () => {
    it('should have correct tool configuration', () => {
      expect(deleteFiles.id).toBe('delete_files');
      expect(deleteFiles.description).toContain('Deletes files at the specified paths');
      expect(deleteFiles.inputSchema).toBeDefined();
      expect(deleteFiles.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        files: [{ path: '/test/file1.txt' }, { path: '/test/file2.txt' }],
      };

      expect(() => deleteFiles.inputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input schema', () => {
      const invalidInput = {
        files: [{}],
      };

      expect(() => deleteFiles.inputSchema.parse(invalidInput)).toThrow();
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(SandboxContextKey.Sandbox, mockSandbox as any);

      const input = {
        files: [{ path: '/test/file.txt' }],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: JSON.stringify([{ success: true, filePath: '/test/file.txt' }]),
        exitCode: 0,
        stderr: '',
      };

      mockGenerateFileDeleteCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(mockGenerateFileDeleteCode).toHaveBeenCalledWith(input.files);
      expect(mockRunTypescript).toHaveBeenCalledWith(mockSandbox, mockCode);
      expect(result.successes).toEqual(['/test/file.txt']);
      expect(result.failures).toEqual([]);
    });

    it('should fallback to local execution when sandbox not available', async () => {
      const input = {
        files: [{ path: '/test/file.txt' }],
      };

      const mockLocalResult = [{ success: true, filePath: '/test/file.txt' }];

      mockDeleteFilesSafely.mockResolvedValue(mockLocalResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(mockDeleteFilesSafely).toHaveBeenCalledWith(input.files);
      expect(result.successes).toEqual(['/test/file.txt']);
      expect(result.failures).toEqual([]);
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(SandboxContextKey.Sandbox, mockSandbox as any);

      const input = {
        files: [{ path: '/test/file.txt' }],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

      mockGenerateFileDeleteCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.successes).toEqual([]);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]).toEqual({
        path: '/test/file.txt',
        error: 'Execution error: Sandbox execution failed: Execution failed',
      });
    });

    it('should handle mixed success and error results', async () => {
      const input = {
        files: [{ path: '/test/file1.txt' }, { path: '/test/file2.txt' }],
      };

      const mockLocalResult = [
        { success: true, filePath: '/test/file1.txt' },
        { success: false, filePath: '/test/file2.txt', error: 'Permission denied' },
      ];

      mockDeleteFilesSafely.mockResolvedValue(mockLocalResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.successes).toEqual(['/test/file1.txt']);
      expect(result.failures).toEqual([
        {
          path: '/test/file2.txt',
          error: 'Permission denied',
        },
      ]);
    });

    it('should handle empty files array', async () => {
      const input = { files: [] };

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.successes).toEqual([]);
      expect(result.failures).toEqual([]);
    });

    it('should handle JSON parse errors from sandbox', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(SandboxContextKey.Sandbox, mockSandbox as any);

      const input = {
        files: [{ path: '/test/file.txt' }],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

      mockGenerateFileDeleteCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await deleteFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.successes).toEqual([]);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0]?.error).toContain('Failed to parse sandbox output');
    });
  });
});
