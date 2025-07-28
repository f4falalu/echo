import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the modules before import
vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  readFile: vi.fn(),
}));

// Import modules after mocking
import * as fs from 'node:fs/promises';

const mockFs = vi.mocked(fs);

describe('read-files-script', () => {
  let originalArgv: string[];
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalArgv = process.argv;
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: string | number | null | undefined) => {
        throw new Error(`Process exit with code ${code}`);
      });
  });

  afterEach(() => {
    process.argv = originalArgv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.resetModules();
  });

  async function runScript(args: string[]) {
    process.argv = ['node', 'read-files-script.ts', ...args];

    // Clear module cache and re-import
    vi.resetModules();
    await import('./read-files-script');

    // Give the async main() time to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  it('should return empty array when no files provided', async () => {
    await runScript([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify([]));
  });

  it('should read a single file successfully', async () => {
    const filePath = 'test.txt';
    const fileContent = 'Hello, World!';

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(fileContent);

    await runScript([filePath]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify([
        {
          success: true,
          filePath,
          content: fileContent,
          truncated: false,
        },
      ])
    );
  });

  it('should read multiple files concurrently', async () => {
    const file1 = 'file1.txt';
    const file2 = 'file2.txt';
    const content1 = 'Content of file 1';
    const content2 = 'Content of file 2';

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValueOnce(content1).mockResolvedValueOnce(content2);

    await runScript([file1, file2]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify([
        {
          success: true,
          filePath: file1,
          content: content1,
          truncated: false,
        },
        {
          success: true,
          filePath: file2,
          content: content2,
          truncated: false,
        },
      ])
    );
  });

  it('should handle non-existent files', async () => {
    const nonExistentFile = 'nonexistent.txt';

    mockFs.access.mockRejectedValue(new Error('ENOENT'));

    await runScript([nonExistentFile]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify([
        {
          success: false,
          filePath: nonExistentFile,
          error: 'File not found',
        },
      ])
    );
  });

  it('should truncate files with more than 1000 lines', async () => {
    const largePath = 'large.txt';
    const lines = Array.from({ length: 1500 }, (_, i) => `Line ${i + 1}`);
    const largeContent = lines.join('\n');

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(largeContent);

    await runScript([largePath]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].success).toBe(true);
    expect(output[0].truncated).toBe(true);
    expect(output[0].content.split('\n')).toHaveLength(1000);
    expect(output[0].content.startsWith('Line 1')).toBe(true);
    expect(output[0].content.endsWith('Line 1000')).toBe(true);
  });

  it('should handle absolute paths', async () => {
    const absolutePath = '/absolute/path/to/file.txt';
    const content = 'Absolute path content';

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue(content);

    await runScript([absolutePath]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify([
        {
          success: true,
          filePath: absolutePath,
          content,
          truncated: false,
        },
      ])
    );
  });

  it('should handle file read errors', async () => {
    const filePath = 'error.txt';

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockRejectedValue(new Error('Permission denied'));

    await runScript([filePath]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify([
        {
          success: false,
          filePath,
          error: 'Permission denied',
        },
      ])
    );
  });

  it('should handle mixed successful and failed reads', async () => {
    const file1 = 'success.txt';
    const file2 = 'nonexistent.txt';
    const file3 = 'another.txt';
    const content1 = 'First file content';
    const content3 = 'Third file content';

    mockFs.access
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('ENOENT'))
      .mockResolvedValueOnce(undefined);

    mockFs.readFile.mockResolvedValueOnce(content1).mockResolvedValueOnce(content3);

    await runScript([file1, file2, file3]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toHaveLength(3);
    expect(output[0]).toEqual({
      success: true,
      filePath: file1,
      content: content1,
      truncated: false,
    });
    expect(output[1]).toEqual({
      success: false,
      filePath: file2,
      error: 'File not found',
    });
    expect(output[2]).toEqual({
      success: true,
      filePath: file3,
      content: content3,
      truncated: false,
    });
  });

  it('should handle files with empty content', async () => {
    const emptyFile = 'empty.txt';

    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockResolvedValue('');

    await runScript([emptyFile]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify([
        {
          success: true,
          filePath: emptyFile,
          content: '',
          truncated: false,
        },
      ])
    );
  });

  it('should handle errors during script execution', async () => {
    const filePath = 'test.txt';

    // Create an unexpected error during execution
    // This will throw an error in the outer catch block
    mockFs.access.mockResolvedValue(undefined);
    mockFs.readFile.mockImplementation(() => {
      throw new Error('Unexpected error during read');
    });

    try {
      await runScript([filePath]);
    } catch (error) {
      // Expected to possibly throw due to process.exit
    }

    // Give time for async error handling
    await new Promise((resolve) => setTimeout(resolve, 100));

    // The error should be caught and logged as a result
    expect(consoleLogSpy).toHaveBeenCalled();
    const output = consoleLogSpy.mock.calls[0]?.[0];
    if (output) {
      const parsed = JSON.parse(output);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].success).toBe(false);
      expect(parsed[0].error).toContain('Unexpected error during read');
    }
  });
});
