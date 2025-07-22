import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import { lsFilesSafely, generateLsCode, type LsOptions } from './ls-files-impl';

vi.mock('node:child_process');
vi.mock('node:fs/promises');

const mockChildProcess = vi.mocked(child_process);
const mockFs = vi.mocked(fs);

describe('ls-files-impl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lsFilesSafely', () => {
    it('should handle successful ls command execution', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockChildProcess.exec.mockImplementation((command, callback) => {
        const cb = callback as (error: null, stdout: string, stderr: string) => void;
        cb(null, 'file1.txt\nfile2.txt\n', '');
        return {} as any;
      });

      const result = await lsFilesSafely(['/test/path']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        success: true,
        path: '/test/path',
        entries: [
          { name: 'file1.txt', type: 'file' },
          { name: 'file2.txt', type: 'file' },
        ],
      });
    });

    it('should handle detailed ls output parsing', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockChildProcess.exec.mockImplementation((command, callback) => {
        const cb = callback as (error: null, stdout: string, stderr: string) => void;
        const detailedOutput = `total 8
-rw-r--r-- 1 user group 1024 Jan 15 10:30 file1.txt
drwxr-xr-x 2 user group 4096 Jan 15 10:31 directory1`;
        cb(null, detailedOutput, '');
        return {} as any;
      });

      const options: LsOptions = { detailed: true };
      const result = await lsFilesSafely(['/test/path'], options);

      expect(result).toHaveLength(1);
      expect(result[0]?.success).toBe(true);
      expect(result[0]?.entries).toHaveLength(2);
      expect(result[0]?.entries?.[0]).toEqual({
        name: 'file1.txt',
        type: 'file',
        size: '1024',
        permissions: '-rw-r--r--',
        modified: 'Jan 15 10:30',
        owner: 'user',
        group: 'group',
      });
      expect(result[0]?.entries?.[1]).toEqual({
        name: 'directory1',
        type: 'directory',
        size: '4096',
        permissions: 'drwxr-xr-x',
        modified: 'Jan 15 10:31',
        owner: 'user',
        group: 'group',
      });
    });

    it('should handle path not found error', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await lsFilesSafely(['/nonexistent/path']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        success: false,
        path: '/nonexistent/path',
        error: 'Path not found',
      });
    });

    it('should handle Windows platform', async () => {
      mockFs.access.mockResolvedValue(undefined);
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });

      const result = await lsFilesSafely(['/test/path']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        success: false,
        path: '/test/path',
        error: 'ls command not available on Windows platform',
      });

      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should handle command execution error', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockChildProcess.exec.mockImplementation((command, callback) => {
        const cb = callback as (error: Error, stdout: string, stderr: string) => void;
        cb(new Error('Permission denied'), '', 'ls: cannot access');
        return {} as any;
      });

      const result = await lsFilesSafely(['/test/path']);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        success: false,
        path: '/test/path',
        error: 'Command failed: ls: cannot access',
      });
    });

    it('should handle multiple paths independently', async () => {
      mockFs.access.mockImplementation((path) => {
        if (path.toString().includes('good')) {
          return Promise.resolve(undefined);
        }
        return Promise.reject(new Error('ENOENT'));
      });

      mockChildProcess.exec.mockImplementation((command, callback) => {
        const cb = callback as (error: null, stdout: string, stderr: string) => void;
        cb(null, 'file.txt\n', '');
        return {} as any;
      });

      const result = await lsFilesSafely(['/good/path', '/bad/path']);

      expect(result).toHaveLength(2);
      expect(result[0]?.success).toBe(true);
      expect(result[1]?.success).toBe(false);
      expect(result[1]?.error).toBe('Path not found');
    });
  });

  describe('generateLsCode', () => {
    it('should generate valid TypeScript code for sandbox execution', () => {
      const paths = ['/test/path1', '/test/path2'];
      const options: LsOptions = { detailed: true, all: true };

      const code = generateLsCode(paths, options);

      expect(code).toContain('const paths = ["/test/path1","/test/path2"]');
      expect(code).toContain('const options = {"detailed":true,"all":true}');
      expect(code).toContain('function buildLsCommand');
      expect(code).toContain('function parseDetailedLsOutput');
      expect(code).toContain('function parseSimpleLsOutput');
      expect(code).toContain('console.log(JSON.stringify(results))');
    });

    it('should generate code that handles empty options', () => {
      const paths = ['/test/path'];
      const code = generateLsCode(paths);

      expect(code).toContain('const options = {}');
    });
  });
});
