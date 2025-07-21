import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { createFiles } from './create-file-tool';
import { SandboxContextKey, type SandboxContext } from '../../../context/sandbox-context';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

vi.mock('./create-file-functions', () => ({
  generateFileCreateCode: vi.fn(),
  createFilesSafely: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';
import { generateFileCreateCode, createFilesSafely } from './create-file-functions';

const mockRunTypescript = vi.mocked(runTypescript);
const mockGenerateFileCreateCode = vi.mocked(generateFileCreateCode);
const mockCreateFilesSafely = vi.mocked(createFilesSafely);

describe('create-file-tool', () => {
  let runtimeContext: RuntimeContext<SandboxContext>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext<SandboxContext>();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFiles tool', () => {
    it('should have correct tool configuration', () => {
      expect(createFiles.id).toBe('create-files');
      expect(createFiles.description).toContain('Create one or more files');
      expect(createFiles.inputSchema).toBeDefined();
      expect(createFiles.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        files: [
          { path: '/test/file1.txt', content: 'content1' },
          { path: '/test/file2.txt', content: 'content2' },
        ],
      };

      expect(() => createFiles.inputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input schema', () => {
      const invalidInput = {
        files: [
          { path: '/test/file1.txt' }, // missing content
        ],
      };

      expect(() => createFiles.inputSchema.parse(invalidInput)).toThrow();
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(SandboxContextKey.Sandbox, mockSandbox as any);

      const input = {
        files: [
          { path: '/test/file.txt', content: 'test content' },
        ],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: JSON.stringify([{ success: true, filePath: '/test/file.txt' }]),
        exitCode: 0,
        stderr: '',
      };

      mockGenerateFileCreateCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(mockGenerateFileCreateCode).toHaveBeenCalledWith(input.files);
      expect(mockRunTypescript).toHaveBeenCalledWith(mockSandbox, mockCode);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/test/file.txt',
      });
    });

    it('should fallback to local execution when sandbox not available', async () => {
      const input = {
        files: [
          { path: '/test/file.txt', content: 'test content' },
        ],
      };

      const mockLocalResult = [
        { success: true, filePath: '/test/file.txt' },
      ];

      mockCreateFilesSafely.mockResolvedValue(mockLocalResult);

      const result = await createFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(mockCreateFilesSafely).toHaveBeenCalledWith(input.files);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/test/file.txt',
      });
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(SandboxContextKey.Sandbox, mockSandbox as any);

      const input = {
        files: [
          { path: '/test/file.txt', content: 'test content' },
        ],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

      mockGenerateFileCreateCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: '/test/file.txt',
        errorMessage: 'Execution error: Sandbox execution failed: Execution failed',
      });
    });

    it('should handle mixed success and error results', async () => {
      const input = {
        files: [
          { path: '/test/file1.txt', content: 'content1' },
          { path: '/test/file2.txt', content: 'content2' },
        ],
      };

      const mockLocalResult = [
        { success: true, filePath: '/test/file1.txt' },
        { success: false, filePath: '/test/file2.txt', error: 'Permission denied' },
      ];

      mockCreateFilesSafely.mockResolvedValue(mockLocalResult);

      const result = await createFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/test/file1.txt',
      });
      expect(result.results[1]).toEqual({
        status: 'error',
        filePath: '/test/file2.txt',
        errorMessage: 'Permission denied',
      });
    });

    it('should handle empty files array', async () => {
      const input = { files: [] };

      const result = await createFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toEqual([]);
    });

    it('should handle JSON parse errors from sandbox', async () => {
      const mockSandbox = { process: { codeRun: vi.fn() } };
      runtimeContext.set(SandboxContextKey.Sandbox, mockSandbox as any);

      const input = {
        files: [
          { path: '/test/file.txt', content: 'test content' },
        ],
      };

      const mockCode = 'generated typescript code';
      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

      mockGenerateFileCreateCode.mockReturnValue(mockCode);
      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFiles.execute({
        context: input,
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: '/test/file.txt',
        errorMessage: expect.stringContaining('Failed to parse sandbox output'),
      });
    });
  });
});
