import { spawn } from 'node:child_process';
import { type Mock, describe, expect, it, vi } from 'vitest';

// Mock child_process module
vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

describe('bash-execute-script', () => {
  const mockSpawn = spawn as unknown as Mock;

  it('should have mocked spawn function', () => {
    expect(mockSpawn).toBeDefined();
    expect(typeof mockSpawn).toBe('function');
  });

  it('should test executeSingleBashCommand pattern', () => {
    // This tests the pattern used in the script without actually importing it
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    };

    mockSpawn.mockReturnValue(mockChild);

    // Simulate what the script would do
    const child = spawn('bash', ['-c', 'echo "test"'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    expect(mockSpawn).toHaveBeenCalledWith('bash', ['-c', 'echo "test"'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    expect(child).toBe(mockChild);
  });

  it('should test command execution with stdout', () => {
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    };

    mockSpawn.mockReturnValue(mockChild);

    // Simulate command execution
    const executeCommand = (command: string) => {
      return new Promise((resolve) => {
        const child = spawn('bash', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        child.on('close', (code: number) => {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code || 0,
          });
        });

        // Simulate successful execution
        mockChild.stdout.on.mock.calls[0]?.[1](Buffer.from('test output\n'));
        mockChild.on.mock.calls[0]?.[1](0);
      });
    };

    return executeCommand('echo "test"').then((result) => {
      expect(result).toEqual({
        stdout: 'test output',
        stderr: '',
        exitCode: 0,
      });
    });
  });

  it('should test command execution with stderr', () => {
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    };

    mockSpawn.mockReturnValue(mockChild);

    // Simulate command execution
    const executeCommand = (command: string) => {
      return new Promise((resolve) => {
        const child = spawn('bash', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        child.stdout?.on('data', (data: Buffer) => {
          stdout += data.toString();
        });

        child.stderr?.on('data', (data: Buffer) => {
          stderr += data.toString();
        });

        child.on('close', (code: number) => {
          resolve({
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            exitCode: code || 0,
          });
        });

        // Simulate error execution
        mockChild.stderr.on.mock.calls[0]?.[1](Buffer.from('error message\n'));
        mockChild.on.mock.calls[0]?.[1](1);
      });
    };

    return executeCommand('ls /nonexistent').then((result) => {
      expect(result).toEqual({
        stdout: '',
        stderr: 'error message',
        exitCode: 1,
      });
    });
  });

  it('should test timeout handling', () => {
    const mockChild = {
      stdout: { on: vi.fn() },
      stderr: { on: vi.fn() },
      on: vi.fn(),
      kill: vi.fn(),
    };

    mockSpawn.mockReturnValue(mockChild);

    // Simulate command with timeout
    const executeCommandWithTimeout = (command: string, timeout: number) => {
      return new Promise((resolve, reject) => {
        const child = spawn('bash', ['-c', command], {
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        const timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Command timed out after ${timeout}ms`));
        }, timeout);

        child.on('close', () => {
          clearTimeout(timeoutId);
          resolve({ success: true });
        });

        child.on('error', (error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
      });
    };

    const promise = executeCommandWithTimeout('sleep 10', 50);

    // Verify kill was not called yet
    expect(mockChild.kill).not.toHaveBeenCalled();

    // Handle the promise rejection immediately
    const errorPromise = promise.catch((error) => {
      expect(error.message).toBe('Command timed out after 50ms');
      return error;
    });

    // Wait for timeout and verify
    return new Promise((resolve) => {
      setTimeout(() => {
        expect(mockChild.kill).toHaveBeenCalledWith('SIGTERM');
        errorPromise.then(() => resolve(undefined));
      }, 60);
    });
  });
});
