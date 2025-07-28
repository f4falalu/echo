import { spawn } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('edit-files-script integration', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'edit-files-test-'));
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  function runScript(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, 'edit-files-script.ts');
      const child = spawn('tsx', [scriptPath, ...args], {
        cwd: tempDir,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code: code || 0 });
      });
    });
  }

  describe('successful operations', () => {
    it('should edit a single file', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'Hello world! This is a test file.', 'utf-8');

      const edits = [
        {
          filePath,
          findString: 'Hello world!',
          replaceString: 'Hi there!',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        success: true,
        filePath,
        message: expect.stringContaining('Successfully replaced'),
      });

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Hi there! This is a test file.');
    });

    it('should edit multiple files', async () => {
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1, 'The quick brown fox', 'utf-8');
      await fs.writeFile(file2, 'jumps over the lazy dog', 'utf-8');

      const edits = [
        {
          filePath: file1,
          findString: 'quick',
          replaceString: 'slow',
        },
        {
          filePath: file2,
          findString: 'lazy',
          replaceString: 'active',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);

      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');
      expect(content1).toBe('The slow brown fox');
      expect(content2).toBe('jumps over the active dog');
    });

    it('should handle relative paths', async () => {
      const relativePath = 'subdir/test.txt';
      const absolutePath = path.join(tempDir, relativePath);

      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, 'Original content here', 'utf-8');

      const edits = [
        {
          filePath: relativePath,
          findString: 'Original',
          replaceString: 'Modified',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results[0].success).toBe(true);

      const content = await fs.readFile(absolutePath, 'utf-8');
      expect(content).toBe('Modified content here');
    });

    it('should handle special characters in find/replace strings', async () => {
      const filePath = path.join(tempDir, 'special.txt');
      await fs.writeFile(filePath, 'function test() { return "value"; }', 'utf-8');

      const edits = [
        {
          filePath,
          findString: 'function test() {',
          replaceString: 'const test = () => {',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results[0].success).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('const test = () => { return "value"; }');
    });

    it('should handle empty replacement string', async () => {
      const filePath = path.join(tempDir, 'remove.txt');
      await fs.writeFile(filePath, 'Keep this REMOVE_ME and this', 'utf-8');

      const edits = [
        {
          filePath,
          findString: 'REMOVE_ME ',
          replaceString: '',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results[0].success).toBe(true);

      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toBe('Keep this and this');
    });
  });

  describe('error handling', () => {
    it('should error when no arguments provided', async () => {
      const result = await runScript([]);

      expect(result.code).toBe(1);
      const error = JSON.parse(result.stdout || result.stderr);
      expect(error[0].error).toContain('No arguments provided');
    });

    it('should error on invalid JSON', async () => {
      const result = await runScript(['not valid json']);

      expect(result.code).toBe(1);
      const error = JSON.parse(result.stdout || result.stderr);
      expect(error[0].error).toContain('Failed to parse arguments');
    });

    it('should error when file not found', async () => {
      const edits = [
        {
          filePath: path.join(tempDir, 'nonexistent.txt'),
          findString: 'test',
          replaceString: 'replaced',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0); // Script succeeds, individual edit fails
      const results = JSON.parse(result.stdout);
      expect(results[0]).toMatchObject({
        success: false,
        error: 'File not found',
      });
    });

    it('should error when find string not found', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'Hello world', 'utf-8');

      const edits = [
        {
          filePath,
          findString: 'Goodbye',
          replaceString: 'Hi',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results[0]).toMatchObject({
        success: false,
        error: 'Find string not found in file: "Goodbye"',
      });
    });

    it('should error when find string appears multiple times', async () => {
      const filePath = path.join(tempDir, 'test.txt');
      await fs.writeFile(filePath, 'test test test', 'utf-8');

      const edits = [
        {
          filePath,
          findString: 'test',
          replaceString: 'replaced',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results[0]).toMatchObject({
        success: false,
        error: expect.stringContaining('appears 3 times'),
      });
    });

    it('should handle mixed success and failure', async () => {
      const file1 = path.join(tempDir, 'exists.txt');
      const file2 = path.join(tempDir, 'missing.txt');

      await fs.writeFile(file1, 'Hello world', 'utf-8');

      const edits = [
        {
          filePath: file1,
          findString: 'Hello',
          replaceString: 'Hi',
        },
        {
          filePath: file2,
          findString: 'test',
          replaceString: 'replaced',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);

      const content = await fs.readFile(file1, 'utf-8');
      expect(content).toBe('Hi world');
    });

    it('should error on missing required fields', async () => {
      const edits = [
        {
          filePath: 'test.txt',
          findString: 'test',
          // missing replaceString
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(1);
      const error = JSON.parse(result.stdout || result.stderr);
      expect(error[0].error).toContain(
        'Each edit must have filePath, findString, and replaceString'
      );
    });

    it('should handle permission errors', async () => {
      const filePath = path.join(tempDir, 'readonly.txt');
      await fs.writeFile(filePath, 'Original content', 'utf-8');
      await fs.chmod(filePath, 0o444); // Read-only

      const edits = [
        {
          filePath,
          findString: 'Original',
          replaceString: 'Modified',
        },
      ];

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('EACCES');

      // Clean up: restore permissions
      await fs.chmod(filePath, 0o644);
    });
  });

  describe('bulk operations', () => {
    it('should handle large number of edits', async () => {
      const edits = [];
      for (let i = 0; i < 20; i++) {
        const filePath = path.join(tempDir, `file${i}.txt`);
        await fs.writeFile(filePath, `Content ${i}`, 'utf-8');
        edits.push({
          filePath,
          findString: `Content ${i}`,
          replaceString: `Modified ${i}`,
        });
      }

      const result = await runScript([JSON.stringify(edits)]);

      expect(result.code).toBe(0);
      const results = JSON.parse(result.stdout);
      expect(results).toHaveLength(20);
      expect(results.every((r: any) => r.success)).toBe(true);

      // Verify a few files
      const content0 = await fs.readFile(path.join(tempDir, 'file0.txt'), 'utf-8');
      const content19 = await fs.readFile(path.join(tempDir, 'file19.txt'), 'utf-8');
      expect(content0).toBe('Modified 0');
      expect(content19).toBe('Modified 19');
    });
  });
});
