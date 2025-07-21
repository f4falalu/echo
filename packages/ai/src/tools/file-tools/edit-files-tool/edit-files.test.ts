import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { editFilesSafely, generateFileEditCode } from './edit-files';

const execAsync = promisify(exec);

describe('edit-files', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-files-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('editFilesSafely - real file system tests', () => {
    it('should edit multiple files concurrently from real file system', async () => {
      // Create test files
      const file1Path = path.join(tempDir, 'file1.txt');
      const file2Path = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1Path, 'Hello world\nThis is a test file');
      await fs.writeFile(file2Path, 'Another test file\nWith different content');

      const edits = [
        {
          filePath: file1Path,
          findString: 'This is a test file',
          replaceString: 'This is a modified file',
        },
        {
          filePath: file2Path,
          findString: 'Another test file',
          replaceString: 'Another modified file',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        success: true,
        filePath: file1Path,
        message: `Successfully replaced "This is a test file" with "This is a modified file" in ${file1Path}`,
      });
      expect(results[1]).toEqual({
        success: true,
        filePath: file2Path,
        message: `Successfully replaced "Another test file" with "Another modified file" in ${file2Path}`,
      });

      const file1Content = await fs.readFile(file1Path, 'utf-8');
      const file2Content = await fs.readFile(file2Path, 'utf-8');
      expect(file1Content).toBe('Hello world\nThis is a modified file');
      expect(file2Content).toBe('Another modified file\nWith different content');
    });

    it('should handle non-existent files', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.txt');

      const edits = [
        {
          filePath: nonExistentPath,
          findString: 'test',
          replaceString: 'replacement',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        success: false,
        filePath: nonExistentPath,
        error: 'File not found',
      });
    });

    it('should handle relative paths', async () => {
      // Create a file in current working directory context
      const fileName = 'test-relative-edit.txt';
      const absolutePath = path.join(process.cwd(), fileName);

      try {
        await fs.writeFile(absolutePath, 'Relative path content to edit');

        const edits = [
          {
            filePath: fileName,
            findString: 'content to edit',
            replaceString: 'content modified',
          },
        ];

        const results = await editFilesSafely(edits);

        expect(results[0]).toEqual({
          success: true,
          filePath: fileName,
          message: `Successfully replaced "content to edit" with "content modified" in ${fileName}`,
        });

        const content = await fs.readFile(absolutePath, 'utf-8');
        expect(content).toBe('Relative path content modified');
      } finally {
        // Clean up
        await fs.unlink(absolutePath).catch(() => {});
      }
    });

    it('should handle find string not found', async () => {
      const testPath = path.join(tempDir, 'test.txt');
      await fs.writeFile(testPath, 'Some content here');

      const edits = [
        {
          filePath: testPath,
          findString: 'nonexistent text',
          replaceString: 'replacement',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toBe('Find string not found in file: "nonexistent text"');
    });

    it('should handle find string appearing multiple times', async () => {
      const testPath = path.join(tempDir, 'test.txt');
      await fs.writeFile(testPath, 'Hello world\nHello again\nGoodbye world');

      const edits = [
        {
          filePath: testPath,
          findString: 'Hello',
          replaceString: 'Hi',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toContain('appears 2 times in file');
      expect(results[0]?.error).toContain('more specific string');
    });

    it('should handle special regex characters in find string', async () => {
      const testPath = path.join(tempDir, 'special.txt');
      await fs.writeFile(testPath, 'Price: $10.99\nOther content');

      const edits = [
        {
          filePath: testPath,
          findString: '$10.99',
          replaceString: '$15.99',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results[0]?.success).toBe(true);
      expect(results[0]?.message).toContain('Successfully replaced');

      const content = await fs.readFile(testPath, 'utf-8');
      expect(content).toBe('Price: $15.99\nOther content');
    });

    it('should handle multiline find strings', async () => {
      const testPath = path.join(tempDir, 'multiline.txt');
      await fs.writeFile(testPath, 'Hello world\nThis is a test\nGoodbye');

      const edits = [
        {
          filePath: testPath,
          findString: 'Hello world\nThis is a test',
          replaceString: 'Greetings\nThis is modified',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results[0]?.success).toBe(true);
      expect(results[0]?.message).toContain('Successfully replaced');

      const content = await fs.readFile(testPath, 'utf-8');
      expect(content).toBe('Greetings\nThis is modified\nGoodbye');
    });

    it('should continue processing when some edits fail', async () => {
      const file1Path = path.join(tempDir, 'file1.txt');
      const nonExistentPath = path.join(tempDir, 'nonexistent.txt');

      await fs.writeFile(file1Path, 'Content to edit');

      const edits = [
        {
          filePath: nonExistentPath,
          findString: 'test',
          replaceString: 'replacement',
        },
        {
          filePath: file1Path,
          findString: 'Content to edit',
          replaceString: 'Content modified',
        },
        {
          filePath: file1Path,
          findString: 'nonexistent',
          replaceString: 'replacement',
        },
      ];

      const results = await editFilesSafely(edits);

      expect(results).toHaveLength(3);
      expect(results[0]?.success).toBe(false);
      expect(results[0]?.error).toBe('File not found');
      expect(results[1]?.success).toBe(true);
      expect(results[2]?.success).toBe(false);
      expect(results[2]?.error).toContain('Find string not found');
    });

    it('should handle permission errors', async () => {
      const restrictedPath = path.join(tempDir, 'restricted.txt');
      await fs.writeFile(restrictedPath, 'Restricted content');

      // Make file unreadable (Unix-specific)
      if (process.platform !== 'win32') {
        await fs.chmod(restrictedPath, 0o000);

        const edits = [
          {
            filePath: restrictedPath,
            findString: 'content',
            replaceString: 'modified',
          },
        ];

        const results = await editFilesSafely(edits);

        expect(results[0]?.success).toBe(false);
        expect(results[0]?.error?.toLowerCase()).toContain('permission denied');

        // Restore permissions for cleanup
        await fs.chmod(restrictedPath, 0o644);
      }
    });
  });

  describe('generateFileEditCode', () => {
    it('should generate valid executable TypeScript code', async () => {
      const testFile = path.join(tempDir, 'code-gen-test.txt');
      await fs.writeFile(testFile, 'Generated code test content');

      const edits = [
        {
          filePath: testFile,
          findString: 'test content',
          replaceString: 'modified content',
        },
      ];

      const code = generateFileEditCode(edits);

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
          message: `Successfully replaced "test content" with "modified content" in ${testFile}`,
        });

        const content = await fs.readFile(testFile, 'utf-8');
        expect(content).toBe('Generated code modified content');
      } catch (error) {
        console.error('Failed to execute generated code:', error);
        throw error;
      }
    });

    it('should handle multiple edits in generated code', async () => {
      const file1 = path.join(tempDir, 'gen1.txt');
      const file2 = path.join(tempDir, 'gen2.txt');

      await fs.writeFile(file1, 'First file content');
      await fs.writeFile(file2, 'Second file content');

      const edits = [
        {
          filePath: file1,
          findString: 'First file',
          replaceString: 'Modified first',
        },
        {
          filePath: file2,
          findString: 'Second file',
          replaceString: 'Modified second',
        },
      ];

      const code = generateFileEditCode(edits);
      const codeFile = path.join(tempDir, 'test-multi.ts');
      await fs.writeFile(codeFile, code);

      const { stdout } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

      const results = JSON.parse(stdout.trim());

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      const file1Content = await fs.readFile(file1, 'utf-8');
      const file2Content = await fs.readFile(file2, 'utf-8');
      expect(file1Content).toBe('Modified first content');
      expect(file2Content).toBe('Modified second content');
    });

    it('should properly escape special characters in edit parameters', () => {
      const edits = [
        {
          filePath: 'file with spaces.txt',
          findString: 'find"with"quotes',
          replaceString: "replace'with'apostrophes",
        },
        {
          filePath: 'file\\with\\backslashes.txt',
          findString: 'find$with$dollars',
          replaceString: 'replace.with.dots',
        },
      ];

      const code = generateFileEditCode(edits);

      // Verify JSON.stringify properly escapes the parameters
      expect(code).toContain(`const edits = ${JSON.stringify(edits)}`);

      // Verify the code contains require statements
      expect(code).toContain("const fs = require('fs')");
      expect(code).toContain("const path = require('path')");
    });

    it('should handle errors in generated code', async () => {
      const nonExistent = path.join(tempDir, 'does-not-exist.txt');

      const edits = [
        {
          filePath: nonExistent,
          findString: 'test',
          replaceString: 'replacement',
        },
      ];

      const code = generateFileEditCode(edits);
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
