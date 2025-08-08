import type { Sandbox } from '@buster/sandbox';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { createFiles } from './create-file-tool';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

import { runTypescript } from '@buster/sandbox';

const mockRunTypescript = vi.mocked(runTypescript);

describe('create-file-tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFiles factory', () => {
    const mockContext = {
      messageId: 'test-message-id',
      sandbox: {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox,
    };

    it('should have correct tool configuration', () => {
      const createFilesTool = createFiles(mockContext);
      expect(createFilesTool.description).toContain('Create one or more files');
      expect(createFilesTool.inputSchema).toBeDefined();
      expect(createFilesTool.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const createFilesTool = createFiles(mockContext);
      const validInput = {
        files: [
          { path: '/test/file1.txt', content: 'content1' },
          { path: '/test/file2.txt', content: 'content2' },
        ],
      };

      expect(() => createFilesTool.inputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input schema', () => {
      const createFilesTool = createFiles(mockContext);
      const invalidInput = {
        files: [
          { path: '/test/file1.txt' }, // missing content
        ],
      };

      expect(() => createFilesTool.inputSchema.parse(invalidInput)).toThrow();
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox;

      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const mockSandboxResult = {
        result: JSON.stringify([{ success: true, filePath: '/test/file.txt' }]),
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFilesTool.execute(input);

      // Verify runTypescript was called (we can't check exact code since it's generated)
      expect(mockRunTypescript).toHaveBeenCalled();
      const call = mockRunTypescript.mock.calls[0];
      expect(call?.[0]).toBe(mockSandbox);
      expect(call?.[1]).toContain('const filesJson =');
      expect(call?.[1]).toContain('fs.mkdirSync');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: '/test/file.txt',
      });
    });

    it('should return error when sandbox not available', async () => {
      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: undefined as any,
      });

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const result = await createFilesTool.execute(input);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: '/test/file.txt',
        errorMessage: 'File creation requires sandbox environment',
      });
    });

    it('should handle sandbox execution errors', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox;

      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFilesTool.execute(input);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: '/test/file.txt',
        errorMessage: 'Execution error: Sandbox execution failed: Execution failed',
      });
    });

    it('should handle mixed success and error results', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox;

      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const input = {
        files: [
          { path: '/test/file1.txt', content: 'content1' },
          { path: '/test/file2.txt', content: 'content2' },
        ],
      };

      const mockSandboxResult = {
        result: JSON.stringify([
          { success: true, filePath: '/test/file1.txt' },
          { success: false, filePath: '/test/file2.txt', error: 'Permission denied' },
        ]),
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFilesTool.execute(input);

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
      const createFilesTool = createFiles(mockContext);
      const input = { files: [] };

      const result = await createFilesTool.execute(input);

      expect(result.results).toEqual([]);
    });

    it('should handle JSON parse errors from sandbox', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox;

      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFilesTool.execute(input);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: '/test/file.txt',
        errorMessage: expect.stringContaining('Failed to parse sandbox output'),
      });
    });

    it('should handle file read errors', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox;

      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      mockRunTypescript.mockRejectedValue(new Error('Script not found'));

      const result = await createFilesTool.execute(input);

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'error',
        filePath: '/test/file.txt',
        errorMessage: 'Execution error: Script not found',
      });
    });

    it('should pass file parameters as JSON string argument', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() },
      } as unknown as Sandbox;

      const createFilesTool = createFiles({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const input = {
        files: [
          { path: '/test/file1.txt', content: 'content1' },
          { path: '/test/file2.txt', content: 'content2' },
        ],
      };

      const mockSandboxResult = {
        result: JSON.stringify([
          { success: true, filePath: '/test/file1.txt' },
          { success: true, filePath: '/test/file2.txt' },
        ]),
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      await createFilesTool.execute(input);

      // Verify that runTypescript was called with generated code
      expect(mockRunTypescript).toHaveBeenCalled();
      const call = mockRunTypescript.mock.calls[0];
      expect(call?.[0]).toBe(mockSandbox);
      expect(call?.[1]).toContain('const filesJson =');
      // Verify the generated code contains the JSON-encoded files
      const expectedJson = JSON.stringify(JSON.stringify(input.files));
      expect(call?.[1]).toContain(expectedJson);
    });
  });
});
