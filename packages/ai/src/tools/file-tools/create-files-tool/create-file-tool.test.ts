import type { Sandbox } from '@buster/sandbox';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { DocsAgentOptions } from '../../../agents/docs-agent/docs-agent';
import { createFiles } from './create-file-tool';

vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

// No longer mocking fs since we generate code inline

import { runTypescript } from '@buster/sandbox';

const mockRunTypescript = vi.mocked(runTypescript);

describe('create-file-tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFiles tool', () => {
    it('should have correct tool configuration', () => {
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
      const mockSandbox = { 
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() } 
      } as unknown as Sandbox;

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const mockSandboxResult = {
        result: JSON.stringify([{ success: true, filePath: '/test/file.txt' }]),
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: mockSandbox,
        } as DocsAgentOptions,
      });

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
      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: undefined,
        } as DocsAgentOptions,
      });

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
        process: { codeRun: vi.fn() }
      } as unknown as Sandbox;

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const mockSandboxResult = {
        result: 'error output',
        exitCode: 1,
        stderr: 'Execution failed',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: mockSandbox,
        } as DocsAgentOptions,
      });

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
        process: { codeRun: vi.fn() }
      } as unknown as Sandbox;

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

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: mockSandbox,
        } as DocsAgentOptions,
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

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
        } as DocsAgentOptions,
      });

      expect(result.results).toEqual([]);
    });

    it('should handle JSON parse errors from sandbox', async () => {
      const mockSandbox = { 
        id: 'test-sandbox',
        fs: {},
        process: { codeRun: vi.fn() }
      } as unknown as Sandbox;

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      const mockSandboxResult = {
        result: 'invalid json output',
        exitCode: 0,
        stderr: '',
      };

      mockRunTypescript.mockResolvedValue(mockSandboxResult);

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: mockSandbox,
        } as DocsAgentOptions,
      });

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
        process: { codeRun: vi.fn() }
      } as unknown as Sandbox;

      const input = {
        files: [{ path: '/test/file.txt', content: 'test content' }],
      };

      mockRunTypescript.mockRejectedValue(new Error('Script not found'));

      const result = await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: mockSandbox,
        } as DocsAgentOptions,
      });

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
        process: { codeRun: vi.fn() }
      } as unknown as Sandbox;

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

      await createFiles.execute(input, {
        experimental_context: {
          folder_structure: 'test',
          userId: 'test-user',
          chatId: 'test-chat',
          dataSourceId: 'test-ds',
          organizationId: 'test-org',
          sandbox: mockSandbox,
        } as DocsAgentOptions,
      });

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
