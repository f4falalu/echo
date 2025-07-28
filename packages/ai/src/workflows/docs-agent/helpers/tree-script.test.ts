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

describe('tree-script', () => {
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
    // Convert args to base64 if they contain JSON
    const processedArgs = args.map((arg) => {
      if (arg.startsWith('{') || arg.startsWith('[')) {
        return Buffer.from(arg).toString('base64');
      }
      return arg;
    });

    process.argv = ['node', 'tree-script.ts', ...processedArgs];

    try {
      // Dynamically import and wait for execution
      await import(`./tree-script?t=${Date.now()}`);
      // Give the async main() time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));
    } catch (error) {
      // Swallow the error - this is expected when process.exit is called
      // Give time for console output to be captured
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  it('should error when no arguments provided', async () => {
    await runScript([]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        success: false,
        error: 'No arguments provided. Expected JSON string as argument.',
      })
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should execute tree command with default options', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      const treeOutput = `.
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── README.md

2 directories, 4 files`;
      cb(null, treeOutput, '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.' })]);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      JSON.stringify({
        success: true,
        output: `.
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── README.md

2 directories, 4 files`,
        command: 'tree "."',
      })
    );
  });

  it('should handle gitignore option', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.', options: { gitignore: true } })]);

    expect(capturedCommand).toContain('--gitignore');
  });

  it('should handle maxDepth option', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.', options: { maxDepth: 2 } })]);

    expect(capturedCommand).toContain('-L 2');
  });

  it('should handle dirsOnly option', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.', options: { dirsOnly: true } })]);

    expect(capturedCommand).toContain('-d');
  });

  it('should handle pattern option', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.', options: { pattern: '*.ts' } })]);

    expect(capturedCommand).toContain('-P "*.ts"');
  });

  it('should handle multiple options combined', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([
      JSON.stringify({
        path: '.',
        options: { gitignore: true, maxDepth: 3, dirsOnly: true, pattern: '*.js' },
      }),
    ]);

    expect(capturedCommand).toContain('--gitignore');
    expect(capturedCommand).toContain('-L 3');
    expect(capturedCommand).toContain('-d');
    expect(capturedCommand).toContain('-P "*.js"');
  });

  it('should handle tree command not found error', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: Error, stdout: string, stderr: string) => void;
      const error = new Error('tree: command not found');
      cb(error, '', 'tree: command not found');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.' })]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toEqual({
      success: false,
      error: 'tree command not installed. Please install tree to use this functionality.',
      command: 'tree "."',
    });
  });

  it('should handle other command execution errors', async () => {
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: Error, stdout: string, stderr: string) => void;
      const error = new Error('Permission denied');
      cb(error, '', 'Permission denied');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '/protected' })]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output).toEqual({
      success: false,
      error: 'Permission denied',
      command: 'tree "/protected"',
    });
  });

  it('should handle absolute paths', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '/absolute/path' })]);

    expect(capturedCommand).toBe('tree "/absolute/path"');
  });

  it('should handle relative paths', async () => {
    let capturedCommand = '';
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      capturedCommand = command;
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, 'tree output', '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '../parent' })]);

    expect(capturedCommand).toContain('tree');
    expect(capturedCommand).toContain('parent"');
  });

  it('should handle invalid JSON input', async () => {
    await runScript(['invalid json']);

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"success":false'));
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle large buffer output', async () => {
    const largeOutput = 'x'.repeat(1024 * 1024); // 1MB of output
    mockChildProcess.exec.mockImplementation((command, options, callback) => {
      const cb = callback as (error: null, stdout: string, stderr: string) => void;
      cb(null, largeOutput, '');
      return {} as any;
    });

    await runScript([JSON.stringify({ path: '.' })]);

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(output.success).toBe(true);
    expect(output.output).toBe(largeOutput);
  });
});
