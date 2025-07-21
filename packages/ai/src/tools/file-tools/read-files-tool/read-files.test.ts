import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateFileReadCode, readFilesSafely } from './read-files';

const execAsync = promisify(exec);

describe('read-files', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'read-files-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('readFilesSafely - real file system tests', () => {
    it('should read multiple files concurrently from real file system', async () => {
      // Create test files
      const file1Path = path.join(tempDir, 'file1.txt');
      const file2Path = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1Path, 'Content of file 1');
      await fs.writeFile(file2Path, 'Content of file 2');

      const results = await readFilesSafely([file1Path, file2Path]);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        success: true,
        filePath: file1Path,
        content: 'Content of file 1',
        truncated: false,
      });
      expect(results[1]).toEqual({
        success: true,
        filePath: file2Path,
        content: 'Content of file 2',
        truncated: false,
      });
    });

    it('should handle non-existent files', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.txt');

      const results = await readFilesSafely([nonExistentPath]);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        success: false,
        filePath: nonExistentPath,
        error: 'File not found',
      });
    });

    it('should handle relative paths', async () => {
      // Create a file in current working directory context
      const fileName = 'test-relative.txt';
      const absolutePath = path.join(process.cwd(), fileName);

      try {
        await fs.writeFile(absolutePath, 'Relative path content');

        const results = await readFilesSafely([fileName]);

        expect(results[0]).toEqual({
          success: true,
          filePath: fileName,
          content: 'Relative path content',
          truncated: false,
        });
      } finally {
        // Clean up
        await fs.unlink(absolutePath).catch(() => {});
      }
    });

    it('should truncate files with more than 1000 lines', async () => {
      const largePath = path.join(tempDir, 'large.txt');
      const lines = Array.from({ length: 1500 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(largePath, lines.join('\n'));

      const results = await readFilesSafely([largePath]);

      expect(results[0]?.success).toBe(true);
      expect(results[0]?.truncated).toBe(true);
      expect(results[0]?.content?.split('\n')).toHaveLength(1000);
      expect(results[0]?.content?.startsWith('Line 1')).toBe(true);
      expect(results[0]?.content?.endsWith('Line 1000')).toBe(true);
    });

    it('should handle permission errors', async () => {
      const restrictedPath = path.join(tempDir, 'restricted.txt');
      await fs.writeFile(restrictedPath, 'Restricted content');

      // Make file unreadable (Unix-specific)
      if (process.platform !== 'win32') {
        await fs.chmod(restrictedPath, 0o000);

        const results = await readFilesSafely([restrictedPath]);

        expect(results[0]?.success).toBe(false);
        expect(results[0]?.error?.toLowerCase()).toContain('permission denied');

        // Restore permissions for cleanup
        await fs.chmod(restrictedPath, 0o644);
      }
    });
  });

  describe('generateFileReadCode', () => {
    it('should generate valid executable TypeScript code', async () => {
      // Create test files
      const testFile = path.join(tempDir, 'code-gen-test.txt');
      await fs.writeFile(testFile, 'Generated code test content');

      const code = generateFileReadCode([testFile]);

      // Write the generated code to a file
      const codeFile = path.join(tempDir, 'test-generated.ts');
      await fs.writeFile(codeFile, code);

      // Execute the generated code with ts-node
      try {
        const { stdout, stderr } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

        if (stderr) {
          console.error('Execution stderr:', stderr);
        }

        // Parse the output
        const results = JSON.parse(stdout.trim());

        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          success: true,
          filePath: testFile,
          content: 'Generated code test content',
          truncated: false,
        });
      } catch (error) {
        console.error('Failed to execute generated code:', error);
        throw error;
      }
    });

    it('should handle multiple files in generated code', async () => {
      const file1 = path.join(tempDir, 'gen1.txt');
      const file2 = path.join(tempDir, 'gen2.txt');

      await fs.writeFile(file1, 'First file');
      await fs.writeFile(file2, 'Second file');

      const code = generateFileReadCode([file1, file2]);
      const codeFile = path.join(tempDir, 'test-multi.ts');
      await fs.writeFile(codeFile, code);

      const { stdout } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

      const results = JSON.parse(stdout.trim());

      expect(results).toHaveLength(2);
      expect(results[0].content).toBe('First file');
      expect(results[1].content).toBe('Second file');
    });

    it('should properly escape special characters in file paths', () => {
      const paths = [
        'file with spaces.txt',
        'file"with"quotes.txt',
        "file'with'apostrophes.txt",
        'file\\with\\backslashes.txt',
      ];

      const code = generateFileReadCode(paths);

      // Verify JSON.stringify properly escapes the paths
      expect(code).toContain(`const filePaths = ${JSON.stringify(paths)}`);

      // Verify the code contains require statements
      expect(code).toContain("const fs = require('fs')");
      expect(code).toContain("const path = require('path')");
    });

    it('should handle errors in generated code', async () => {
      const nonExistent = path.join(tempDir, 'does-not-exist.txt');

      const code = generateFileReadCode([nonExistent]);
      const codeFile = path.join(tempDir, 'test-error.ts');
      await fs.writeFile(codeFile, code);

      const { stdout } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

      const results = JSON.parse(stdout.trim());

      expect(results[0]).toEqual({
        success: false,
        filePath: nonExistent,
        error: 'File not found',
      });
    });
  });
});
