import * as child_process from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the modules
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

const mockChildProcess = vi.mocked(child_process);

describe('rg-search-script', () => {
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

  async function runScript(commands: any[]) {
    process.argv = ['node', 'grep-search-script.ts', JSON.stringify(commands)];

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

  it('should execute ripgrep commands and return stdout', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '2:This is a test line\n4:Another test here\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -n "test" test.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -n "test" test.txt',
      stdout: '2:This is a test line\n4:Another test here\n',
      stderr: '',
    });
  });

  it('should handle recursive searches with rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'dir/file1.txt:3:Match in file1\ndir/file2.txt:1:Match in file2\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -n "Match" dir',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -n "Match" dir',
      stdout: 'dir/file1.txt:3:Match in file1\ndir/file2.txt:1:Match in file2\n',
      stderr: '',
    });
  });

  it('should handle case-insensitive searches with rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:HELLO world\n2:hello WORLD\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -i -n "hello" case.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -i -n "hello" case.txt',
      stdout: '1:HELLO world\n2:hello WORLD\n',
      stderr: '',
    });
  });

  it('should handle word match option with rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:test word\n3:word test word\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -w -n "test" word.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -w -n "test" word.txt',
      stdout: '1:test word\n3:word test word\n',
      stderr: '',
    });
  });

  it('should handle fixed strings option with rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:Price is $10.99\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -F -n "$10.99" price.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -F -n "$10.99" price.txt',
      stdout: '1:Price is $10.99\n',
      stderr: '',
    });
  });

  it('should handle inverted matches with rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '2:Line without pattern\n4:Another line without\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -v -n "test" invert.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -v -n "test" invert.txt',
      stdout: '2:Line without pattern\n4:Another line without\n',
      stderr: '',
    });
  });

  it('should handle max count option with rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:Match 1\n2:Match 2\n3:Match 3\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -m 3 -n "Match" max.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -m 3 -n "Match" max.txt',
      stdout: '1:Match 1\n2:Match 2\n3:Match 3\n',
      stderr: '',
    });
  });

  it('should handle no matches found (exit code 1)', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: any, stdout: string, stderr: string) => void;
      const error = new Error('Command failed') as any;
      error.code = 1;
      cb(error, '', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -n "nonexistent" nomatch.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -n "nonexistent" nomatch.txt',
      stdout: '',
      stderr: '',
    });
  });

  it('should handle multiple commands', async () => {
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
        command: 'rg -n "Match" file1.txt',
      },
      {
        command: 'rg -n "Match" file2.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toHaveLength(2);
    expect(output[0].stdout).toBe('1:Match in file1\n');
    expect(output[1].stdout).toBe('2:Match in file2\n');
  });

  it('should handle invalid JSON input', async () => {
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
    expect(output[0].error).toBe('Invalid input: expected array of commands');
  });

  it('should execute commands with special characters as-is', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, '1:Pattern with "quotes"\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg -n "Pattern with \\"quotes\\"" special.txt',
      },
    ]);

    // Check that the command is passed as-is
    expect(capturedCommand).toBe('rg -n "Pattern with \\"quotes\\"" special.txt');
  });

  it('should handle output without line numbers', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      // Without line numbers, output is just the content
      cb(null, 'This is a test line\nAnother test here\n', '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg "test" test.txt',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg "test" test.txt',
      stdout: 'This is a test line\nAnother test here\n',
      stderr: '',
    });
  });

  it('should handle JSON output from rg', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      const jsonOutput = JSON.stringify([
        {
          type: 'match',
          data: { path: { text: 'file.txt' }, lines: { text: 'match' }, line_number: 1 },
        },
      ]);
      cb(null, jsonOutput, '');
      return {} as any;
    });

    await runScript([
      {
        command: 'rg --json "test" dir',
      },
    ]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg --json "test" dir',
      stdout: JSON.stringify([
        {
          type: 'match',
          data: { path: { text: 'file.txt' }, lines: { text: 'match' }, line_number: 1 },
        },
      ]),
      stderr: '',
    });
  });
});
