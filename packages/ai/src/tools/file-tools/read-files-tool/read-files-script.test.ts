import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('read-files-script', () => {
  const scriptPath = path.join(__dirname, 'read-files-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'read-files-test-'));
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
  }

  describe('functional tests', () => {
    it('should read a single file successfully', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');

      // Run the script
      const { stdout } = await runScript([testFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
          content: 'test content',
          truncated: false,
        },
      ]);
    });

    it('should handle non-existent file', async () => {
      const nonExistentFile = path.join(tempDir, 'nonexistent.txt');

      // Run the script
      const { stdout } = await runScript([nonExistentFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: false,
          filePath: nonExistentFile,
          error: 'File not found',
        },
      ]);
    });

    it('should read multiple files', async () => {
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
      expect(results[0]).toMatchObject({ success: true, content: 'content1' });
      expect(results[1]).toMatchObject({ success: true, content: 'content2' });
      expect(results[2]).toMatchObject({ success: true, content: 'content3' });
    });

    it('should handle JSON array input', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1, 'content 1');
      await fs.writeFile(file2, 'content 2');

      // Run the script with JSON array - runScript will handle escaping
      const { stdout } = await runScript([JSON.stringify([file1, file2])]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ success: true, content: 'content 1' });
      expect(results[1]).toMatchObject({ success: true, content: 'content 2' });
    });

    it('should read empty file', async () => {
      // Create an empty file
      const emptyFile = path.join(tempDir, 'empty.txt');
      await fs.writeFile(emptyFile, '');

      // Run the script
      const { stdout } = await runScript([emptyFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: emptyFile,
          content: '',
          truncated: false,
        },
      ]);
    });

    it('should truncate large files', async () => {
      // Create a large file with more than 1000 lines
      const largeFile = path.join(tempDir, 'large.txt');
      const lines = Array.from({ length: 1500 }, (_, i) => `Line ${i + 1}`);
      await fs.writeFile(largeFile, lines.join('\n'));

      // Run the script
      const { stdout } = await runScript([largeFile]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].truncated).toBe(true);

      const contentLines = results[0].content.split('\n');
      expect(contentLines).toHaveLength(1000);
      expect(contentLines[0]).toBe('Line 1');
      expect(contentLines[999]).toBe('Line 1000');
    });

    it('should handle relative paths', async () => {
      const originalCwd = process.cwd();
      try {
        // Change to temp directory
        process.chdir(tempDir);

        // Create a test file
        await fs.writeFile('relative.txt', 'relative content');

        // Run the script with relative path
        const { stdout } = await runScript(['relative.txt']);
        const results = JSON.parse(stdout);

        expect(results).toEqual([
          {
            success: true,
            filePath: 'relative.txt',
            content: 'relative content',
            truncated: false,
          },
        ]);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should handle no arguments', async () => {
      try {
        await runScript([]);
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // The script exits with code 1, so exec throws
        const results = JSON.parse(error.stdout);
        expect(results).toEqual([
          {
            success: false,
            filePath: '',
            error: 'No arguments provided',
          },
        ]);
      }
    });

    it('should handle files with spaces in names', async () => {
      // Create a file with spaces
      const testFile = path.join(tempDir, 'file with spaces.txt');
      await fs.writeFile(testFile, 'content with spaces');

      // Run the script - runScript will handle escaping
      const { stdout } = await runScript([testFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
          content: 'content with spaces',
          truncated: false,
        },
      ]);
    });

    it('should handle special characters in content', async () => {
      // Create a file with special characters
      const testFile = path.join(tempDir, 'special.txt');
      const specialContent = 'Special characters: @#$%^&*()_+\n"Quotes"\n\'Apostrophes\'';
      await fs.writeFile(testFile, specialContent);

      // Run the script
      const { stdout } = await runScript([testFile]);
      const results = JSON.parse(stdout);

      expect(results).toEqual([
        {
          success: true,
          filePath: testFile,
          content: specialContent,
          truncated: false,
        },
      ]);
    });
  });
});
