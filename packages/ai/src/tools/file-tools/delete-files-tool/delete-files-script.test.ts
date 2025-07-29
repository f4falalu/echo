import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('delete-files-script', () => {
  const scriptPath = path.join(__dirname, 'delete-files-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'delete-files-test-'));
  });

  afterEach(async () => {
    // Clean up temporary directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function runScript(
    args: string[]
  ): Promise<{ stdout: string; stderr: string; error?: any }> {
    try {
      // Properly escape arguments for shell
      const escapedArgs = args.map((arg) => {
        // If it contains special characters, wrap in single quotes
        if (arg.includes(' ') || arg.includes('"') || arg.includes('[') || arg.includes(']')) {
          return `'${arg.replace(/'/g, "'\"'\"'")}'`;
        }
        return arg;
      });
      const { stdout, stderr } = await exec(`npx tsx ${scriptPath} ${escapedArgs.join(' ')}`);
      return { stdout, stderr };
    } catch (error: any) {
      // If the command exits with non-zero code, exec throws
      // But we can still access stdout/stderr from the error
      return { stdout: error.stdout || '', stderr: error.stderr || '', error };
    }
  }

  describe('functional tests', () => {
    it('should successfully delete a single file', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Run the script
      const { stdout } = await runScript([testFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          path: testFile,
        },
      ]);

      // Verify file was deleted
      await expect(fs.access(testFile)).rejects.toThrow();
    });

    it('should handle non-existent file', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      // Run the script
      const { stdout } = await runScript([nonExistentFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: false,
          path: nonExistentFile,
          error: 'File not found',
        },
      ]);
    });

    it('should handle multiple files', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      const file3 = path.join(tempDir, 'file3.txt');

      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');
      await fs.writeFile(file3, 'content3');

      // Run the script
      const { stdout } = await runScript([file1, file2, file3]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      expect(results.every((r: any) => r.success)).toBe(true);

      // Verify all files were deleted
      await expect(fs.access(file1)).rejects.toThrow();
      await expect(fs.access(file2)).rejects.toThrow();
      await expect(fs.access(file3)).rejects.toThrow();
    });

    it('should handle JSON array input', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1, 'content1');
      await fs.writeFile(file2, 'content2');

      // Run the script with JSON array
      const { stdout } = await runScript([JSON.stringify([file1, file2])]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(2);
      expect(results.every((r: any) => r.success)).toBe(true);

      // Verify files were deleted
      await expect(fs.access(file1)).rejects.toThrow();
      await expect(fs.access(file2)).rejects.toThrow();
    });

    it('should prevent directory deletion', async () => {
      // Create a test directory
      const testDir = path.join(tempDir, 'testdir');
      await fs.mkdir(testDir);

      // Run the script
      const { stdout } = await runScript([testDir]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: false,
          path: testDir,
          error: 'Cannot delete directories with this tool',
        },
      ]);

      // Verify directory still exists
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to temp directory
        process.chdir(tempDir);

        // Create a test file
        await fs.writeFile('relative.txt', 'content');

        // Run the script with relative path
        const { stdout } = await runScript(['relative.txt']);
        const results = JSON.parse(stdout);

        expect(results).toEqual([
          {
            success: true,
            path: 'relative.txt',
          },
        ]);

        // Verify file was deleted
        await expect(fs.access('relative.txt')).rejects.toThrow();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle no arguments', async () => {
      const { stdout, error } = await runScript([]);
      expect(error).toBeUndefined(); // Script exits with code 0
      const results = JSON.parse(stdout);

      expect(results).toEqual([]);
    });

    it('should handle files with spaces in names', async () => {
      // Create a file with spaces
      const testFile = path.join(tempDir, 'file with spaces.txt');
      await fs.writeFile(testFile, 'content');

      // Run the script - escaping is handled by runScript
      const { stdout } = await runScript([testFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          path: testFile,
        },
      ]);

      // Verify file was deleted
      await expect(fs.access(testFile)).rejects.toThrow();
    });
  });
});
