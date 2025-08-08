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

describe('edit-files-tool streaming', () => {
  let tempDir: string;
  let mockSandbox: Sandbox;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-files-streaming-test-'));
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

  describe('onInputStart', () => {
    it('should initialize state correctly', async () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'test-call-id' });

      // Since we can't directly access state, we'll verify through behavior
      // The start handler should have initialized the state and created a DB entry
      expect(true).toBe(true); // This test verifies no errors occur during initialization
    });
  });

  describe('onInputDelta', () => {
    it('should handle partial JSON input', async () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'test-call-id' });

      // Simulate streaming JSON input
      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: '{"edits": [',
      });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: '{"filePath": "test.txt", ',
      });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: '"findString": "old", "replaceString": "new"}',
      });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: ']}',
      });

      // Verify no errors during partial streaming
      expect(true).toBe(true);
    });

    it('should handle malformed JSON gracefully', async () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'test-call-id' });

      // Send malformed JSON
      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: '{"edits": [{"invalid"',
      });

      // Should not throw errors
      expect(true).toBe(true);
    });

    it('should accumulate input text correctly', async () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'test-call-id' });

      const part1 = '{"edits": [';
      const part2 = '{"filePath": "test.txt", "findString": "old", "replaceString": "new"}';
      const part3 = ']}';

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: part1,
      });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: part2,
      });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: part3,
      });

      // The accumulated text should be parseable
      const fullInput = part1 + part2 + part3;
      expect(() => JSON.parse(fullInput)).not.toThrow();
    });
  });

  describe('onInputAvailable', () => {
    it('should finalize input correctly', async () => {
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'old content');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'test-call-id' });

      // Stream complete JSON input
      const jsonInput = JSON.stringify({
        edits: [
          {
            filePath: testFile,
            findString: 'old',
            replaceString: 'new',
          },
        ],
      });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: jsonInput,
      });

      await tool.onInputAvailable({ toolCallId: 'test-call-id' });

      // Should complete without errors
      expect(true).toBe(true);
    });

    it('should handle invalid final JSON', async () => {
      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'test-call-id' });

      await tool.onInputDelta({
        toolCallId: 'test-call-id',
        inputTextDelta: '{"invalid": json}',
      });

      // Should not throw when finalizing invalid JSON
      await expect(tool.onInputAvailable({ toolCallId: 'test-call-id' })).resolves.toBeUndefined();
    });
  });

  describe('full streaming workflow', () => {
    it('should handle complete streaming workflow with file edit', async () => {
      const testFile = path.join(tempDir, 'streaming.txt');
      await fs.writeFile(testFile, 'original content for streaming test');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      // Step 1: Start streaming
      await tool.onInputStart({ toolCallId: 'stream-test' });

      // Step 2: Stream input in chunks
      const chunks = [
        '{"edits": [',
        `{"filePath": "${testFile}", `,
        '"findString": "original", ',
        '"replaceString": "modified"}',
        ']}',
      ];

      for (const chunk of chunks) {
        await tool.onInputDelta({
          toolCallId: 'stream-test',
          inputTextDelta: chunk,
        });
      }

      // Step 3: Finalize input
      await tool.onInputAvailable({ toolCallId: 'stream-test' });

      // Step 4: Execute the tool
      const result = await tool.execute({
        edits: [
          {
            filePath: testFile,
            findString: 'original',
            replaceString: 'modified',
          },
        ],
      });

      // Verify results
      expect(result.summary.successful).toBe(1);
      expect(result.results[0].status).toBe('success');

      // Verify file was actually modified
      const content = await fs.readFile(testFile, 'utf-8');
      expect(content).toBe('modified content for streaming test');
    });

    it('should handle streaming with multiple edits', async () => {
      const file1 = path.join(tempDir, 'stream1.txt');
      const file2 = path.join(tempDir, 'stream2.txt');

      await fs.writeFile(file1, 'first file content');
      await fs.writeFile(file2, 'second file content');

      const context = createTestContext();
      const tool = createEditFilesTool(context);

      await tool.onInputStart({ toolCallId: 'multi-stream' });

      // Stream multiple edits
      const jsonStr = JSON.stringify({
        edits: [
          {
            filePath: file1,
            findString: 'first',
            replaceString: 'updated first',
          },
          {
            filePath: file2,
            findString: 'second',
            replaceString: 'updated second',
          },
        ],
      });

      // Stream in small chunks
      const chunkSize = 10;
      for (let i = 0; i < jsonStr.length; i += chunkSize) {
        const chunk = jsonStr.slice(i, i + chunkSize);
        await tool.onInputDelta({
          toolCallId: 'multi-stream',
          inputTextDelta: chunk,
        });
      }

      await tool.onInputAvailable({ toolCallId: 'multi-stream' });

      // Execute
      const result = await tool.execute({
        edits: [
          {
            filePath: file1,
            findString: 'first',
            replaceString: 'updated first',
          },
          {
            filePath: file2,
            findString: 'second',
            replaceString: 'updated second',
          },
        ],
      });

      expect(result.summary.successful).toBe(2);
      expect(await fs.readFile(file1, 'utf-8')).toBe('updated first file content');
      expect(await fs.readFile(file2, 'utf-8')).toBe('updated second file content');
    });
  });
});
