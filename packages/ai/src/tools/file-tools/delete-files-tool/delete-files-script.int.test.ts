import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('delete-files-script integration tests', () => {
  let tempDir: string;
  const scriptPath = path.join(__dirname, 'delete-files-script.ts');

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

  async function runScript(args: string[]): Promise<{ stdout: string; stderr: string }> {
    const { stdout, stderr } = await exec(`npx tsx ${scriptPath} ${args.join(' ')}`);
    return { stdout, stderr };
  }

  describe('single file deletion', () => {
    it('should successfully delete a single file', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Run the script
      const { stdout } = await runScript([testFile]);

      // Parse the output
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

      // Parse the output
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: false,
          path: nonExistentFile,
          error: 'File not found',
        },
      ]);
    });

    it('should prevent deletion of directories', async () => {
      // Create a test directory
      const testDir = path.join(tempDir, 'testdir');
      await fs.mkdir(testDir);

      // Run the script
      const { stdout } = await runScript([testDir]);

      // Parse the output
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
  });

  describe('multiple file deletion', () => {
    it('should delete multiple files in parallel', async () => {
      // Create multiple test files
      const files = await Promise.all(
        ['file1.txt', 'file2.txt', 'file3.txt'].map(async (name) => {
          const filePath = path.join(tempDir, name);
          await fs.writeFile(filePath, `content of ${name}`);
          return filePath;
        })
      );

      // Run the script
      const { stdout } = await runScript(files);

      // Parse the output
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      for (const file of files) {
        expect(results).toContainEqual({
          success: true,
          path: file,
        });
      }

      // Verify all files were deleted
      for (const file of files) {
        await expect(fs.access(file)).rejects.toThrow();
      }
    });

    it('should handle mixed success and failure', async () => {
      // Create some files and a directory
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      const testDir = path.join(tempDir, 'testdir');
      const nonExistent = path.join(tempDir, 'nonexistent.txt');

      await fs.writeFile(file1, 'content 1');
      await fs.writeFile(file2, 'content 2');
      await fs.mkdir(testDir);

      // Run the script
      const { stdout } = await runScript([file1, nonExistent, testDir, file2]);

      // Parse the output
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(4);
      expect(results).toContainEqual({
        success: true,
        path: file1,
      });
      expect(results).toContainEqual({
        success: true,
        path: file2,
      });
      expect(results).toContainEqual({
        success: false,
        path: nonExistent,
        error: 'File not found',
      });
      expect(results).toContainEqual({
        success: false,
        path: testDir,
        error: 'Cannot delete directories with this tool',
      });

      // Verify successful deletions
      await expect(fs.access(file1)).rejects.toThrow();
      await expect(fs.access(file2)).rejects.toThrow();

      // Verify directory still exists
      const stats = await fs.stat(testDir);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('path handling', () => {
    it('should handle relative paths', async () => {
      // Create a file in a subdirectory
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);
      const testFile = path.join(subDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Change to temp directory and use relative path
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        // Run the script with relative path
        const { stdout } = await runScript(['./subdir/test.txt']);

        // Parse the output
        const results = JSON.parse(stdout);

        expect(results).toEqual([
          {
            success: true,
            path: './subdir/test.txt',
          },
        ]);

        // Verify file was deleted
        await expect(fs.access(testFile)).rejects.toThrow();
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle files with spaces in names', async () => {
      // Create a file with spaces in the name
      const testFile = path.join(tempDir, 'file with spaces.txt');
      await fs.writeFile(testFile, 'test content');

      // Run the script
      const { stdout } = await runScript([`"${testFile}"`]);

      // Parse the output
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

    it('should handle special characters in filenames', async () => {
      // Create files with special characters
      const specialFiles = ['file-with-dash.txt', 'file_with_underscore.txt', 'file.with.dots.txt'];

      const filePaths = await Promise.all(
        specialFiles.map(async (name) => {
          const filePath = path.join(tempDir, name);
          await fs.writeFile(filePath, `content of ${name}`);
          return filePath;
        })
      );

      // Run the script
      const { stdout } = await runScript(filePaths);

      // Parse the output
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(3);
      for (const file of filePaths) {
        expect(results).toContainEqual({
          success: true,
          path: file,
        });
      }

      // Verify all files were deleted
      for (const file of filePaths) {
        await expect(fs.access(file)).rejects.toThrow();
      }
    });
  });

  describe('empty input handling', () => {
    it('should return empty array when no arguments provided', async () => {
      // Run the script with no arguments
      const { stdout } = await runScript([]);

      // Parse the output
      const results = JSON.parse(stdout);

      expect(results).toEqual([]);
    });
  });

  describe('permission handling', () => {
    it('should handle permission denied errors gracefully', async () => {
      // Skip this test on Windows as it handles permissions differently
      if (process.platform === 'win32') {
        return;
      }

      // Create a file in a protected directory
      const protectedDir = path.join(tempDir, 'protected');
      await fs.mkdir(protectedDir);
      const testFile = path.join(protectedDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Make the directory read-only
      await fs.chmod(protectedDir, 0o444);

      try {
        // Run the script
        const { stdout } = await runScript([testFile]);

        // Parse the output
        const results = JSON.parse(stdout);

        expect(results).toHaveLength(1);
        expect(results[0].success).toBe(false);
        expect(results[0].path).toBe(testFile);
        expect(results[0].error).toContain('EACCES');
      } finally {
        // Restore permissions for cleanup
        await fs.chmod(protectedDir, 0o755);
      }
    });
  });
});
