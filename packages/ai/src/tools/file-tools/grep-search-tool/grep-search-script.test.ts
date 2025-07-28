import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the modules before import
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
}));

// Import modules after mocking
import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';

const mockChildProcess = vi.mocked(child_process);
const mockFs = vi.mocked(fs);

describe('grep-search-script', () => {
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

  async function runScript(searches: any[]) {
    process.argv = ['node', 'grep-search-script.ts', JSON.stringify(searches)];

    // Clear module cache and reimport
    vi.resetModules();
    await import('./grep-search-script');

    // Give the async main() time to complete
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  it('should return empty array when no arguments provided', async () => {
    process.argv = ['node', 'grep-search-script.ts'];

    vi.resetModules();
    await import('./grep-search-script');
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify([]));
  });

  it('should search for patterns in files', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '2:This is a test line\n4:Another test here\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'test.txt',
        pattern: 'test',
        recursive: false,
        lineNumbers: true,
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      path: 'test.txt',
      pattern: 'test',
      matches: [
        { file: 'test.txt', lineNumber: 2, content: 'This is a test line' },
        { file: 'test.txt', lineNumber: 4, content: 'Another test here' },
      ],
      matchCount: 2,
    });
  });

  it('should handle recursive searches', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'dir/file1.txt:3:Match in file1\ndir/file2.txt:1:Match in file2\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'dir',
        pattern: 'Match',
        recursive: true,
        lineNumbers: true,
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].matches).toEqual([
      { file: 'dir/file1.txt', lineNumber: 3, content: 'Match in file1' },
      { file: 'dir/file2.txt', lineNumber: 1, content: 'Match in file2' },
    ]);
  });

  it('should handle case-insensitive searches', async () => {
    mockFs.access.mockResolvedValue(undefined);
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:HELLO world\n2:hello WORLD\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'case.txt',
        pattern: 'hello',
        ignoreCase: true,
        lineNumbers: true,
      },
    ]);

    expect(capturedCommand).toContain('-i');
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].matchCount).toBe(2);
  });

  it('should handle word match option', async () => {
    mockFs.access.mockResolvedValue(undefined);
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:test word\n3:word test word\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'word.txt',
        pattern: 'test',
        wordMatch: true,
        lineNumbers: true,
      },
    ]);

    expect(capturedCommand).toContain('-w');
  });

  it('should handle fixed strings option', async () => {
    mockFs.access.mockResolvedValue(undefined);
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:Price is $10.99\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'price.txt',
        pattern: '$10.99',
        fixedStrings: true,
        lineNumbers: true,
      },
    ]);

    expect(capturedCommand).toContain('-F');
  });

  it('should handle inverted matches', async () => {
    mockFs.access.mockResolvedValue(undefined);
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '2:Line without pattern\n4:Another line without\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'invert.txt',
        pattern: 'test',
        invertMatch: true,
        lineNumbers: true,
      },
    ]);

    expect(capturedCommand).toContain('-v');
  });

  it('should handle max count option', async () => {
    mockFs.access.mockResolvedValue(undefined);
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:Match 1\n2:Match 2\n3:Match 3\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'max.txt',
        pattern: 'Match',
        maxCount: 3,
        lineNumbers: true,
      },
    ]);

    expect(capturedCommand).toContain('-m 3');
  });

  it('should handle no matches found (exit code 1)', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: any, stdout: string, stderr: string) => void;
      const error = new Error('Command failed') as any;
      error.code = 1;
      cb(error, '', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'nomatch.txt',
        pattern: 'nonexistent',
        lineNumbers: true,
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      path: 'nomatch.txt',
      pattern: 'nonexistent',
      matches: [],
      matchCount: 0,
    });
  });

  it('should handle path not found error', async () => {
    mockFs.access.mockRejectedValue(new Error('ENOENT'));

    await runScript([
      {
        path: '/nonexistent/path',
        pattern: 'test',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: false,
      path: '/nonexistent/path',
      pattern: 'test',
      error: 'Path does not exist: /nonexistent/path',
    });
  });

  it('should handle Windows platform', async () => {
    mockFs.access.mockResolvedValue(undefined);
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    await runScript([
      {
        path: 'test.txt',
        pattern: 'test',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: false,
      path: 'test.txt',
      pattern: 'test',
      error: 'grep command not available on Windows platform',
    });

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('should handle command execution error', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: Error, stdout: string, stderr: string) => void;
      cb(new Error('Permission denied'), '', 'grep: cannot access');
      return {} as any;
    });

    await runScript([
      {
        path: 'test.txt',
        pattern: 'test',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: false,
      path: 'test.txt',
      pattern: 'test',
      error: 'Command failed: grep: cannot access',
    });
  });

  it('should handle multiple searches', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      if (command.includes('file1.txt')) {
        cb(null, '1:Match in file1\n', '');
      } else if (command.includes('file2.txt')) {
        cb(null, '2:Match in file2\n', '');
      }
      return {} as any;
    });

    await runScript([
      {
        path: 'file1.txt',
        pattern: 'Match',
        lineNumbers: true,
      },
      {
        path: 'file2.txt',
        pattern: 'Match',
        lineNumbers: true,
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toHaveLength(2);
    expect(output[0].matches[0].content).toBe('Match in file1');
    expect(output[1].matches[0].content).toBe('Match in file2');
  });

  it('should handle invalid input', async () => {
    process.argv = ['node', 'grep-search-script.ts', 'not-json'];

    vi.resetModules();
    await import('./grep-search-script');
    await new Promise((resolve) => setTimeout(resolve, 10));

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toContain('Failed to parse input');
  });

  it('should handle non-array input', async () => {
    process.argv = ['node', 'grep-search-script.ts', '{"not": "array"}'];

    vi.resetModules();
    await import('./grep-search-script');
    await new Promise((resolve) => setTimeout(resolve, 10));

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toBe('Invalid input: expected array of searches');
  });

  it('should properly escape special characters in patterns', async () => {
    mockFs.access.mockResolvedValue(undefined);
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:Pattern with "quotes"\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'special.txt',
        pattern: 'Pattern with "quotes"',
        lineNumbers: true,
      },
    ]);

    // Check that quotes are properly escaped in the command
    expect(capturedCommand).toContain('\\"');
  });

  it('should handle searches without line numbers', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      // Without line numbers, output is just the content
      cb(null, 'This is a test line\nAnother test here\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'test.txt',
        pattern: 'test',
        lineNumbers: false,
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].matches).toEqual([
      { file: 'test.txt', content: 'This is a test line' },
      { file: 'test.txt', content: 'Another test here' },
    ]);
  });

  it('should handle recursive searches without line numbers', async () => {
    mockFs.access.mockResolvedValue(undefined);
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'dir/file1.txt:Match in file1\ndir/file2.txt:Match in file2\n', '');
      return {} as any;
    });

    await runScript([
      {
        path: 'dir',
        pattern: 'Match',
        recursive: true,
        lineNumbers: false,
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0].matches).toEqual([
      { file: 'dir/file1.txt', content: 'Match in file1' },
      { file: 'dir/file2.txt', content: 'Match in file2' },
    ]);
  });
});
