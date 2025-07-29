import * as child_process from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const exec = promisify(child_process.exec);

describe('grep-search-script', () => {
  const scriptPath = path.join(__dirname, 'grep-search-script.ts');
  let tempDir: string;

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'grep-search-test-'));
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
    it('should return empty array when no arguments provided', async () => {
      const { stdout } = await runScript([]);
      const results = JSON.parse(stdout);
      expect(results).toEqual([]);
    });

    it('should search for pattern in a single file', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'test.txt');
      await fs.writeFile(
        testFile,
        'line 1\nthis is a test line\nline 3\nanother test here\nline 5'
      );

      const commands = [
        {
          command: `rg -n "test" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('2:this is a test line');
      expect(results[0].stdout).toContain('4:another test here');
    });

    it('should handle case-insensitive search', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'case.txt');
      await fs.writeFile(testFile, 'HELLO world\nhello WORLD\nHeLLo WoRlD');

      const commands = [
        {
          command: `rg -i -n "hello" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout.split('\n').filter(Boolean)).toHaveLength(3);
    });

    it('should search recursively in directories', async () => {
      // Create directory structure
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);
      await fs.writeFile(path.join(tempDir, 'file1.txt'), 'test in file1');
      await fs.writeFile(path.join(subDir, 'file2.txt'), 'test in file2');

      const commands = [
        {
          command: `rg -n "test" ${tempDir}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('file1.txt');
      expect(results[0].stdout).toContain('file2.txt');
    });

    it('should handle no matches found', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'nomatch.txt');
      await fs.writeFile(testFile, 'line 1\nline 2\nline 3');

      const commands = [
        {
          command: `rg -n "nonexistent" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0]).toEqual({
        success: true,
        command: `rg -n "nonexistent" ${testFile}`,
        stdout: '',
        stderr: '',
      });
    });

    it('should handle word boundaries', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'word.txt');
      await fs.writeFile(testFile, 'test word\ntesting\nword test word');

      const commands = [
        {
          command: `rg -w -n "test" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('1:test word');
      expect(results[0].stdout).toContain('3:word test word');
      expect(results[0].stdout).not.toContain('testing');
    });

    it('should handle fixed strings (literal search)', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'regex.txt');
      await fs.writeFile(testFile, 'Price is $10.99\n$10.99 is the price\n10.99 dollars');

      const commands = [
        {
          command: `rg -F -n "$10.99" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      // Should find $10.99 in first two lines
      const matches = results[0].stdout.split('\n').filter(Boolean);
      expect(matches.filter((m: string) => m.includes('$10.99'))).toHaveLength(2);
    });

    it('should handle inverted matches', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'invert.txt');
      await fs.writeFile(
        testFile,
        'line with test\nline without pattern\ntest again\nanother line without'
      );

      const commands = [
        {
          command: `rg -v -n "test" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('2:line without pattern');
      expect(results[0].stdout).toContain('4:another line without');
    });

    it('should handle multiple commands', async () => {
      // Create test files
      const file1 = path.join(tempDir, 'file1.txt');
      const file2 = path.join(tempDir, 'file2.txt');
      await fs.writeFile(file1, 'match in file1');
      await fs.writeFile(file2, 'match in file2');

      const commands = [
        { command: `rg -n "match" ${file1}` },
        { command: `rg -n "match" ${file2}` },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('match in file1');
      expect(results[1].success).toBe(true);
      expect(results[1].stdout).toContain('match in file2');
    });

    it('should handle base64 encoded input', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'base64.txt');
      await fs.writeFile(testFile, 'base64 test content');

      const commands = [{ command: `rg "test" ${testFile}` }];
      const base64Input = Buffer.from(JSON.stringify(commands)).toString('base64');

      const { stdout } = await runScript([base64Input]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('base64 test content');
    });

    it('should handle file not found error', async () => {
      const commands = [
        {
          command: `rg "test" ${path.join(tempDir, 'nonexistent.txt')}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBeTruthy();
    });

    it('should handle invalid JSON input', async () => {
      const { stdout } = await runScript(['not valid json']);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toContain('Failed to parse input');
    });

    it('should handle non-array input', async () => {
      const { stdout } = await runScript(['{"not": "array"}']);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(false);
      expect(results[0].error).toBe('Invalid input: expected array of commands');
    });

    it('should handle max count option', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'max.txt');
      await fs.writeFile(testFile, 'match 1\nmatch 2\nmatch 3\nmatch 4\nmatch 5');

      const commands = [
        {
          command: `rg -m 3 -n "match" ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      const matches = results[0].stdout.split('\n').filter(Boolean);
      expect(matches).toHaveLength(3);
    });

    it('should handle file type filtering', async () => {
      // Create files with different extensions
      await fs.writeFile(path.join(tempDir, 'test.js'), 'const test = "match"');
      await fs.writeFile(path.join(tempDir, 'test.txt'), 'match in text');
      await fs.writeFile(path.join(tempDir, 'test.md'), 'match in markdown');

      const commands = [
        {
          command: `rg -t js "match" ${tempDir}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('test.js');
      expect(results[0].stdout).not.toContain('test.txt');
      expect(results[0].stdout).not.toContain('test.md');
    });

    it('should handle special characters in patterns', async () => {
      // Create a test file
      const testFile = path.join(tempDir, 'special.txt');
      await fs.writeFile(
        testFile,
        'Pattern with "quotes"\n[brackets] and {braces}\n$special$ characters'
      );

      const commands = [
        {
          command: `rg -F '"quotes"' ${testFile}`,
        },
      ];

      const { stdout } = await runScript([JSON.stringify(commands)]);
      const results = JSON.parse(stdout);

      expect(results[0].success).toBe(true);
      expect(results[0].stdout).toContain('Pattern with "quotes"');
    });
  });
});
