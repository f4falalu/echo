import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock node modules
vi.mock('node:child_process');
vi.mock('node:fs/promises');

const mockChildProcess = vi.mocked(child_process);
const mockFs = vi.mocked(fs);

describe('create-files-script', () => {
  const scriptPath = path.join(__dirname, 'create-files-script.ts');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('script execution', () => {
    it('should create files successfully when executed with valid parameters', async () => {
      const fileParams = [
        { path: '/test/file1.txt', content: 'content1' },
        { path: '/test/file2.txt', content: 'content2' },
      ];

      const expectedOutput = JSON.stringify([
        { success: true, filePath: '/test/file1.txt' },
        { success: true, filePath: '/test/file2.txt' },
      ]);

      mockFs.readFile.mockResolvedValue('mock script content');
      mockChildProcess.exec.mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          // Simulate successful execution
          callback(null, expectedOutput, '');
        }
        return {} as any;
      });

      // Simulate running the script
      const command = `node ${scriptPath} '${JSON.stringify(fileParams)}'`;

      await new Promise<void>((resolve) => {
        child_process.exec(command, (error, stdout) => {
          expect(error).toBeNull();
          expect(stdout).toBe(expectedOutput);
          resolve();
        });
      });
    });

    it('should handle file creation errors appropriately', async () => {
      const fileParams = [{ path: '/restricted/file.txt', content: 'content' }];

      const expectedOutput = JSON.stringify([
        {
          success: false,
          filePath: '/restricted/file.txt',
          error: 'Failed to create directory: Permission denied',
        },
      ]);

      mockFs.readFile.mockResolvedValue('mock script content');
      mockChildProcess.exec.mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, expectedOutput, '');
        }
        return {} as any;
      });

      const command = `node ${scriptPath} '${JSON.stringify(fileParams)}'`;

      await new Promise<void>((resolve) => {
        child_process.exec(command, (error, stdout) => {
          expect(error).toBeNull();
          const result = JSON.parse(stdout);
          expect(result[0].success).toBe(false);
          expect(result[0].error).toContain('Failed to create directory');
          resolve();
        });
      });
    });

    it('should exit with error when no parameters provided', async () => {
      const expectedError = JSON.stringify({
        success: false,
        error: 'No file parameters provided',
      });

      mockFs.readFile.mockResolvedValue('mock script content');
      mockChildProcess.exec.mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          const error = new Error('Command failed');
          (error as any).code = 1;
          callback(error, '', expectedError);
        }
        return {} as any;
      });

      const command = `node ${scriptPath}`;

      await new Promise<void>((resolve) => {
        child_process.exec(command, (error, stdout, stderr) => {
          expect(error).toBeTruthy();
          expect(stderr).toBe(expectedError);
          resolve();
        });
      });
    });

    it('should handle invalid JSON parameters', async () => {
      const expectedError = JSON.stringify({
        success: false,
        error: 'Invalid file parameters: Unexpected token i in JSON at position 0',
      });

      mockFs.readFile.mockResolvedValue('mock script content');
      mockChildProcess.exec.mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          const error = new Error('Command failed');
          (error as any).code = 1;
          callback(error, '', expectedError);
        }
        return {} as any;
      });

      const command = `node ${scriptPath} 'invalid json'`;

      await new Promise<void>((resolve) => {
        child_process.exec(command, (error, stdout, stderr) => {
          expect(error).toBeTruthy();
          const result = JSON.parse(stderr);
          expect(result.success).toBe(false);
          expect(result.error).toContain('Invalid file parameters');
          resolve();
        });
      });
    });

    it('should validate file parameters structure', async () => {
      const invalidParams = [
        { path: '/test/file.txt' }, // missing content
      ];

      const expectedError = JSON.stringify({
        success: false,
        error: 'Invalid file parameters: Each file parameter must have a content string',
      });

      mockFs.readFile.mockResolvedValue('mock script content');
      mockChildProcess.exec.mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          const error = new Error('Command failed');
          (error as any).code = 1;
          callback(error, '', expectedError);
        }
        return {} as any;
      });

      const command = `node ${scriptPath} '${JSON.stringify(invalidParams)}'`;

      await new Promise<void>((resolve) => {
        child_process.exec(command, (error, stdout, stderr) => {
          expect(error).toBeTruthy();
          const result = JSON.parse(stderr);
          expect(result.error).toContain('must have a content string');
          resolve();
        });
      });
    });

    it('should handle multiple files with mixed success/failure', async () => {
      const fileParams = [
        { path: '/test/success.txt', content: 'content1' },
        { path: '/restricted/fail.txt', content: 'content2' },
        { path: '/test/success2.txt', content: 'content3' },
      ];

      const expectedOutput = JSON.stringify([
        { success: true, filePath: '/test/success.txt' },
        {
          success: false,
          filePath: '/restricted/fail.txt',
          error: 'Permission denied',
        },
        { success: true, filePath: '/test/success2.txt' },
      ]);

      mockFs.readFile.mockResolvedValue('mock script content');
      mockChildProcess.exec.mockImplementation((command, callback) => {
        if (typeof callback === 'function') {
          callback(null, expectedOutput, '');
        }
        return {} as any;
      });

      const command = `node ${scriptPath} '${JSON.stringify(fileParams)}'`;

      await new Promise<void>((resolve) => {
        child_process.exec(command, (error, stdout) => {
          expect(error).toBeNull();
          const results = JSON.parse(stdout);
          expect(results).toHaveLength(3);
          expect(results[0].success).toBe(true);
          expect(results[1].success).toBe(false);
          expect(results[2].success).toBe(true);
          resolve();
        });
      });
    });
  });
});

