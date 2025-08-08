import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import type { Sandbox } from '@buster/sandbox';
import { runTypescript } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockSandbox } from '../../../workflows/docs-agent/test-helpers/mock-sandbox';
import { createEditFilesTool } from './edit-files-tool';

// Mock the database function
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue(undefined),
}));

// Mock runTypescript to actually perform file operations
vi.mock('@buster/sandbox', async (importOriginal) => {
  const original = await importOriginal<typeof import('@buster/sandbox')>();
  return {
    ...original,
    runTypescript: vi.fn(),
  };
});

describe('edit-files-tool', () => {
  let tempDir: string;
  let mockSandbox: Sandbox;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-files-test-'));
    mockSandbox = createMockSandbox();

    // Mock runTypescript to actually perform file operations on the temp directory
    const runTypescriptMock = vi.mocked(runTypescript);
    runTypescriptMock.mockImplementation(async (_sandbox, code) => {
      try {
        // Execute the CommonJS code in a controlled environment
        const originalCwd = process.cwd();
        process.chdir(tempDir);

        try {
          // Execute the code and capture console output
          let output = '';
          const originalLog = console.log;
          console.log = (data: any) => {
            output += data;
          };

          try {
            // Execute the code in the Node.js context by using eval
            // This allows the require statements to work properly
            // biome-ignore lint/security/noGlobalEval: Required for test mocking
            eval(code);

            return {
              result: output,
              stderr: '',
              exitCode: 0,
            };
          } finally {
            console.log = originalLog;
          }
        } finally {
          process.chdir(originalCwd);
        }
      } catch (error) {
        return {
          result: '',
          stderr: error instanceof Error ? error.message : 'Execution error',
          exitCode: 1,
        };
      }
    });
  });

  const createTestContext = () => ({
    messageId: 'test-message-id',
    sandbox: mockSandbox,
  });

  describe('factory function', () => {
    it('should create a tool with correct properties', () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      expect(tool).toBeDefined();
      expect(tool.toolName).toBeUndefined(); // Unnamed tools don't have toolName
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(typeof tool.execute).toBe('function');
      expect(typeof tool.onInputStart).toBe('function');
      expect(typeof tool.onInputDelta).toBe('function');
      expect(typeof tool.onInputAvailable).toBe('function');
    });
  });

  describe('tool execution', () => {
    it('should edit a single file successfully', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello world! This is a test.');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          {
            filePath: testFile,
            findString: 'Hello world!',
            replaceString: 'Hi there!',
          },
        ],
      };

      const result = await tool.execute(input);

      expect(result).toEqual({
        results: [
          {
            status: 'success',
            file_path: testFile,
            message: expect.stringContaining(
              'Successfully replaced "Hello world!" with "Hi there!"'
            ),
          },
        ],
        summary: {
          total: 1,
          successful: 1,
          failed: 0,
        },
      });

      // Verify file content was changed
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('Hi there! This is a test.');
    });

    it('should handle file not found', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          {
            filePath: nonExistentFile,
            findString: 'test',
            replaceString: 'replaced',
          },
        ],
      };

      const result = await tool.execute(input);

      expect(result).toEqual({
        results: [
          {
            status: 'error',
            file_path: nonExistentFile,
            error_message: 'File not found',
          },
        ],
        summary: {
          total: 1,
          successful: 0,
          failed: 1,
        },
      });
    });

    it('should handle multiple edits', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1, 'The quick brown fox');
      await fs.writeFile(file2, 'jumps over the lazy dog');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          { filePath: file1, findString: 'quick', replaceString: 'slow' },
          { filePath: file2, findString: 'lazy', replaceString: 'active' },
        ],
      };

      const result = await tool.execute(input);

      expect(result.summary).toEqual({
        total: 2,
        successful: 2,
        failed: 0,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results.every((r) => r.status === 'success')).toBe(true);

      // Verify all files were edited
      expect(await fs.readFile(file1, 'utf-8')).toBe('The slow brown fox');
      expect(await fs.readFile(file2, 'utf-8')).toBe('jumps over the active dog');
    });

    it('should handle find string not found', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'Hello world');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          {
            filePath: testFile,
            findString: 'Goodbye',
            replaceString: 'Hi',
          },
        ],
      };

      const result = await tool.execute(input);

      expect(result).toEqual({
        results: [
          {
            status: 'error',
            file_path: testFile,
            error_message: 'Find string not found in file: "Goodbye"',
          },
        ],
        summary: {
          total: 1,
          successful: 0,
          failed: 1,
        },
      });

      // Verify file was not changed
      expect(await fs.readFile(testFile, 'utf-8')).toBe('Hello world');
    });

    it('should handle find string appearing multiple times', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test test test');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          {
            filePath: testFile,
            findString: 'test',
            replaceString: 'replaced',
          },
        ],
      };

      const result = await tool.execute(input);

      expect(result.results[0].status).toBe('error');
      expect(result.results[0].error_message).toContain('appears 3 times');

      // Verify file was not changed
      expect(await fs.readFile(testFile, 'utf-8')).toBe('test test test');
    });

    it('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to temp directory
        process.chdir(tempDir);

        // Create a test file
        await fs.writeFile('relative.txt', 'relative content');

        const context = createTestContext();
        const tool = createEditFilesTool(context);

        const input = {
          edits: [
            {
              filePath: 'relative.txt',
              findString: 'relative',
              replaceString: 'absolute',
            },
          ],
        };

        const result = await tool.execute(input);

        expect(result.results[0].status).toBe('success');
        expect(await fs.readFile('relative.txt', 'utf-8')).toBe('absolute content');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle empty edits array', async () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = { edits: [] };

      const result = await tool.execute(input);

      expect(result).toEqual({
        results: [],
        summary: { total: 0, successful: 0, failed: 0 },
      });
    });

    it('should handle no sandbox environment', async () => {
      const context = {
        messageId: 'test-message-id',
        sandbox: undefined as any,
      };

      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          {
            filePath: 'test.txt',
            findString: 'test',
            replaceString: 'replaced',
          },
        ],
      };

      const result = await tool.execute(input);

      expect(result).toEqual({
        results: [
          {
            status: 'error',
            file_path: 'test.txt',
            error_message: 'File editing requires sandbox environment',
          },
        ],
        summary: {
          total: 1,
          successful: 0,
          failed: 1,
        },
      });
    });

    it('should handle mixed success and failure', async () => {
      const file1 = path.join(tempDir, 'exists.txt');
      const file2 = path.join(tempDir, 'missing.txt');

      await fs.writeFile(file1, 'Hello world');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      const input = {
        edits: [
          { filePath: file1, findString: 'Hello', replaceString: 'Hi' },
          { filePath: file2, findString: 'test', replaceString: 'replaced' },
        ],
      };

      const result = await tool.execute(input);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].status).toBe('success');
      expect(result.results[1].status).toBe('error');
      expect(result.results[1].error_message).toBe('File not found');

      // Verify successful edit
      expect(await fs.readFile(file1, 'utf-8')).toBe('Hi world');
    });
  });
});
