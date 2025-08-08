import type { Sandbox } from '@buster/sandbox';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteFilesToolInputSchema, createDeleteFilesTool } from './delete-files-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('delete-files-tool', () => {
  const mockContext = {
    messageId: 'test-message-id',
    sandbox: {
      id: 'test-sandbox',
      process: {
        codeRun: vi.fn(),
      },
    } as unknown as Sandbox,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDeleteFilesTool factory', () => {
    it('should create a tool with correct configuration', () => {
      const tool = createDeleteFilesTool(mockContext);

      expect(tool.description).toContain('Deletes files at the specified paths');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        paths: ['/test/file1.txt', '/test/file2.txt'],
      };

      expect(() => DeleteFilesToolInputSchema.parse(validInput)).not.toThrow();
    });

    it('should reject invalid input schema', () => {
      const invalidInput = {
        paths: [123, 456], // Should be strings
      };

      expect(() => DeleteFilesToolInputSchema.parse(invalidInput)).toThrow();
    });

    it('should execute with sandbox when available', async () => {
      const mockCodeRun = vi.fn();
      const testContext = {
        ...mockContext,
        sandbox: {
          id: 'test-sandbox',
          process: { codeRun: mockCodeRun },
        } as unknown as Sandbox,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/file.txt'],
      };

      // Mock the test for directory check
      mockCodeRun.mockResolvedValueOnce({
        result: JSON.stringify({ isDirectory: false }),
        exitCode: 0,
        stderr: '',
      });

      // Mock the rm command execution
      mockCodeRun.mockResolvedValueOnce({
        result: 'SUCCESS',
        exitCode: 0,
        stderr: '',
      });

      const result = await tool.execute(input);

      expect(mockCodeRun).toHaveBeenCalledTimes(2);

      // Check the directory test call
      const testCall = mockCodeRun.mock.calls[0];
      expect(testCall?.[0]).toContain('fs.statSync');

      // Check the delete call
      const deleteCall = mockCodeRun.mock.calls[1];
      expect(deleteCall?.[0]).toContain('rm ');

      expect(result.results).toEqual([
        {
          status: 'success',
          path: '/test/file.txt',
        },
      ]);
    });

    it('should return error when sandbox not available', async () => {
      const testContext = {
        ...mockContext,
        sandbox: undefined as any,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/file.txt'],
      };

      const result = await tool.execute(input);

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: 'File deletion requires sandbox environment',
        },
      ]);
    });

    it('should handle sandbox execution errors', async () => {
      const mockCodeRun = vi.fn();
      const testContext = {
        ...mockContext,
        sandbox: {
          id: 'test-sandbox',
          process: { codeRun: mockCodeRun },
        } as unknown as Sandbox,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/file.txt'],
      };

      // Mock the test for directory check
      mockCodeRun.mockResolvedValueOnce({
        result: JSON.stringify({ isDirectory: false }),
        exitCode: 0,
        stderr: '',
      });

      // Mock the rm command execution with failure
      mockCodeRun.mockResolvedValueOnce({
        result: 'ERROR: No such file or directory',
        exitCode: 1,
      });

      const result = await tool.execute(input);

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: 'File not found',
        },
      ]);
    });

    it('should handle mixed success and error results', async () => {
      const mockCodeRun = vi.fn();
      const testContext = {
        ...mockContext,
        sandbox: {
          id: 'test-sandbox',
          process: { codeRun: mockCodeRun },
        } as unknown as Sandbox,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/file1.txt', '/test/file2.txt'],
      };

      // Mock first file - success case
      mockCodeRun.mockResolvedValueOnce({
        result: JSON.stringify({ isDirectory: false }),
        exitCode: 0,
        stderr: '',
      });
      mockCodeRun.mockResolvedValueOnce({
        result: 'SUCCESS',
        exitCode: 0,
        stderr: '',
      });

      // Mock second file - error case
      mockCodeRun.mockResolvedValueOnce({
        result: JSON.stringify({ isDirectory: false }),
        exitCode: 0,
        stderr: '',
      });
      mockCodeRun.mockResolvedValueOnce({
        result: 'ERROR: Permission denied',
        exitCode: 1,
      });

      const result = await tool.execute(input);

      expect(result.results).toEqual([
        {
          status: 'success',
          path: '/test/file1.txt',
        },
        {
          status: 'error',
          path: '/test/file2.txt',
          error_message: 'ERROR: Permission denied',
        },
      ]);
    });

    it('should handle empty paths array', async () => {
      const tool = createDeleteFilesTool(mockContext);
      const input = { paths: [] };

      const result = await tool.execute(input);

      expect(result.results).toEqual([]);
    });

    it('should handle directory deletion attempts', async () => {
      const mockCodeRun = vi.fn();
      const testContext = {
        ...mockContext,
        sandbox: {
          id: 'test-sandbox',
          process: { codeRun: mockCodeRun },
        } as unknown as Sandbox,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/directory'],
      };

      // Mock the test for directory check - returns true for directory
      mockCodeRun.mockResolvedValueOnce({
        result: JSON.stringify({ isDirectory: true }),
        exitCode: 0,
        stderr: '',
      });

      const result = await tool.execute(input);

      expect(mockCodeRun).toHaveBeenCalledTimes(1); // Only directory check, no rm call
      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/directory',
          error_message: 'Cannot delete directories with this tool',
        },
      ]);
    });

    it('should handle multiple files sequentially', async () => {
      const mockCodeRun = vi.fn();
      const testContext = {
        ...mockContext,
        sandbox: {
          id: 'test-sandbox',
          process: { codeRun: mockCodeRun },
        } as unknown as Sandbox,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/file1.txt', '/test/file2.txt', '/test/file3.txt'],
      };

      // Mock all three files as successful deletions
      for (let i = 0; i < 3; i++) {
        // Directory check
        mockCodeRun.mockResolvedValueOnce({
          result: JSON.stringify({ isDirectory: false }),
          exitCode: 0,
          stderr: '',
        });
        // Delete command
        mockCodeRun.mockResolvedValueOnce({
          result: 'SUCCESS',
          exitCode: 0,
          stderr: '',
        });
      }

      const result = await tool.execute(input);

      expect(mockCodeRun).toHaveBeenCalledTimes(6); // 2 calls per file
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

    it('should handle codeRun errors', async () => {
      const mockCodeRun = vi.fn();
      const testContext = {
        ...mockContext,
        sandbox: {
          id: 'test-sandbox',
          process: { codeRun: mockCodeRun },
        } as unknown as Sandbox,
      };

      const tool = createDeleteFilesTool(testContext);
      const input = {
        paths: ['/test/file.txt'],
      };

      // Mock codeRun to throw an error
      mockCodeRun.mockRejectedValue(new Error('Sandbox execution failed'));

      const result = await tool.execute(input);

      expect(result.results).toEqual([
        {
          status: 'error',
          path: '/test/file.txt',
          error_message: 'Sandbox execution failed',
        },
      ]);
    });
  });
});
