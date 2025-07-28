import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { type Sandbox, createSandbox } from '@buster/sandbox';
import { addFiles } from '@buster/sandbox';
import { runTypescript } from '@buster/sandbox';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('grep-search-script integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;
  let scriptContent: string;

  beforeAll(async () => {
    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });

    // Read the script content
    const scriptPath = path.join(__dirname, 'grep-search-script.ts');
    scriptContent = await fs.readFile(scriptPath, 'utf-8');

    // Create test files and directories in sandbox using addFiles
    const testFiles = [
      {
        path: 'file1.txt',
        content: 'Hello world\nThis is a test file\nGoodbye world\nAnother test line',
        destination: 'file1.txt',
      },
      {
        path: 'file2.txt',
        content: 'Different content\nHello again\nFinal line\nTest content here',
        destination: 'file2.txt',
      },
      {
        path: 'case-test.txt',
        content: 'HELLO World\nhello world\nHeLLo WoRLd\nHELLO WORLD',
        destination: 'case-test.txt',
      },
      {
        path: 'subdir/nested1.txt',
        content: 'Nested file content\nHello from nested1\nTest in subdirectory',
        destination: 'subdir/nested1.txt',
      },
      {
        path: 'subdir/nested2.txt',
        content: 'Another nested file\nHello from nested2\nMore test content',
        destination: 'subdir/nested2.txt',
      },
      {
        path: 'special-chars.txt',
        content: 'Price: $10.99\nPattern: test.*\nArray: [1,2,3]\nRegex: ^start.*end$',
        destination: 'special-chars.txt',
      },
      {
        path: 'word-test.txt',
        content: 'test testing tested\nword test word\ntester test\ntest',
        destination: 'word-test.txt',
      },
      {
        path: 'invert-test.txt',
        content: 'Line with test\nLine without pattern\nAnother test line\nNo match here',
        destination: 'invert-test.txt',
      },
      {
        path: 'many-matches.txt',
        content: Array(10).fill('match line').join('\n'),
        destination: 'many-matches.txt',
      },
    ];

    await addFiles(sandbox, testFiles);
  }, 60000); // 60 second timeout for sandbox creation

  afterAll(async () => {
    // Clean up the sandbox
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should return empty array when no commands provided', async () => {
    const result = await runTypescript(sandbox, scriptContent);
    const output = JSON.parse(result.result);

    expect(output).toEqual([]);
  });

  it.skipIf(!hasApiKey)('should execute rg commands in single file', async () => {
    const commands = [
      {
        command: 'rg -n "test" file1.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output).toHaveLength(1);
    expect(output[0].success).toBe(true);
    expect(output[0].command).toBe('rg -n "test" file1.txt');
    expect(output[0].stdout).toContain('2:This is a test file');
    expect(output[0].stdout).toContain('4:Another test line');
  });

  it.skipIf(!hasApiKey)('should handle case-insensitive searches', async () => {
    const commands = [
      {
        command: 'rg -i -n "hello" case-test.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('1:HELLO World');
    expect(output[0].stdout).toContain('2:hello world');
    expect(output[0].stdout).toContain('3:HeLLo WoRLd');
    expect(output[0].stdout).toContain('4:HELLO WORLD');
  });

  it.skipIf(!hasApiKey)('should handle recursive searches', async () => {
    const commands = [
      {
        command: 'rg -n "Hello"',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('file1.txt:1:Hello world');
    expect(output[0].stdout).toContain('file2.txt:2:Hello again');
    expect(output[0].stdout).toContain('subdir/nested1.txt:2:Hello from nested1');
    expect(output[0].stdout).toContain('subdir/nested2.txt:2:Hello from nested2');
  });

  it.skipIf(!hasApiKey)('should handle whole word matches', async () => {
    const commands = [
      {
        command: 'rg -w -n "test" word-test.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('1:test testing tested');
    expect(output[0].stdout).toContain('2:word test word');
    expect(output[0].stdout).toContain('4:test');
    // Should not match "tester" as it's not a whole word
    expect(output[0].stdout).not.toContain('3:tester test');
  });

  it.skipIf(!hasApiKey)('should handle fixed string searches (literal)', async () => {
    const commands = [
      {
        command: 'rg -F -n "$10.99" special-chars.txt',
      },
      {
        command: 'rg -F -n "test.*" special-chars.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output).toHaveLength(2);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('1:Price: $10.99');
    expect(output[1].success).toBe(true);
    expect(output[1].stdout).toContain('2:Pattern: test.*');
  });

  it.skipIf(!hasApiKey)('should handle inverted matches', async () => {
    const commands = [
      {
        command: 'rg -v -n "test" invert-test.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('2:Line without pattern');
    expect(output[0].stdout).toContain('4:No match here');
    // Should not include lines with "test"
    expect(output[0].stdout).not.toContain('1:Line with test');
    expect(output[0].stdout).not.toContain('3:Another test line');
  });

  it.skipIf(!hasApiKey)('should handle max count limit', async () => {
    const commands = [
      {
        command: 'rg -m 3 -n "match" many-matches.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    const lines = output[0].stdout.trim().split('\n');
    expect(lines).toHaveLength(3); // Should only return 3 matches
  });

  it.skipIf(!hasApiKey)('should handle no matches found', async () => {
    const commands = [
      {
        command: 'rg -n "nonexistent" file1.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0]).toEqual({
      success: true,
      command: 'rg -n "nonexistent" file1.txt',
      stdout: '',
      stderr: '',
    });
  });

  it.skipIf(!hasApiKey)('should handle file not found errors', async () => {
    const commands = [
      {
        command: 'rg "test" /nonexistent/file.txt',
      },
      {
        command: 'rg "test" another-missing.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output).toHaveLength(2);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toBeDefined();
    expect(output[1].success).toBe(false);
    expect(output[1].error).toBeDefined();
  });

  it.skipIf(!hasApiKey)('should handle multiple commands', async () => {
    const commands = [
      {
        command: 'rg -n "test" file1.txt',
      },
      {
        command: 'rg -n "Hello" file2.txt',
      },
      {
        command: 'rg -n "nonexistent" file1.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output).toHaveLength(3);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('test');
    expect(output[1].success).toBe(true);
    expect(output[1].stdout).toContain('Hello');
    expect(output[2].success).toBe(true);
    expect(output[2].stdout).toBe(''); // No matches
  });

  it.skipIf(!hasApiKey)('should handle searches without line numbers', async () => {
    const commands = [
      {
        command: 'rg "test" file1.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('This is a test file');
    expect(output[0].stdout).toContain('Another test line');
    // Should not contain line numbers
    expect(output[0].stdout).not.toMatch(/^\d+:/m);
  });

  it.skipIf(!hasApiKey)('should handle invalid input gracefully', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['not-json'],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toContain('Failed to parse input');
  });

  it.skipIf(!hasApiKey)('should handle non-array input', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['{"not": "array"}'],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toBe('Invalid input: expected array of commands');
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    const commands = [
      {
        command: 'rg -n "test" /file1.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('test');
  });

  it.skipIf(!hasApiKey)('should handle complex rg commands', async () => {
    const commands = [
      {
        command: 'rg -i -v -m 5 -n "test" file2.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    // Should return lines that don't contain "test" (case-insensitive)
    expect(output[0].stdout).toContain('1:Different content');
    expect(output[0].stdout).toContain('2:Hello again');
    expect(output[0].stdout).toContain('3:Final line');
    // Should not contain line 4 with "Test content here"
    expect(output[0].stdout).not.toContain('4:Test content here');
  });

  it.skipIf(!hasApiKey)('should handle JSON output from rg', async () => {
    const commands = [
      {
        command: 'rg --json "test" file1.txt',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);

    // The stdout should contain JSON lines
    const jsonLines = output[0].stdout.trim().split('\n');
    expect(jsonLines.length).toBeGreaterThan(0);

    // Parse and check the first line
    const firstLine = JSON.parse(jsonLines[0]);
    expect(firstLine.type).toBe('begin');

    // Find match lines
    const matchLines = jsonLines.filter((line: string) => {
      try {
        const parsed = JSON.parse(line);
        return parsed.type === 'match';
      } catch {
        return false;
      }
    });
    expect(matchLines.length).toBeGreaterThan(0);
  });

  it.skipIf(!hasApiKey)('should handle type-specific searches', async () => {
    // Create some TypeScript files
    const tsFiles = [
      {
        path: 'code.ts',
        content: 'TODO: implement feature\nconst test = 123;',
        destination: 'code.ts',
      },
      {
        path: 'test.js',
        content: 'TODO: fix bug\nfunction test() {}',
        destination: 'test.js',
      },
      {
        path: 'readme.md',
        content: 'TODO: update docs',
        destination: 'readme.md',
      },
    ];

    await addFiles(sandbox, tsFiles);

    const commands = [
      {
        command: 'rg --type ts -n "TODO"',
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(commands)],
    });

    const output = JSON.parse(result.result);
    expect(output[0].success).toBe(true);
    expect(output[0].stdout).toContain('code.ts:1:TODO: implement feature');
    // Should not include .js or .md files
    expect(output[0].stdout).not.toContain('test.js');
    expect(output[0].stdout).not.toContain('readme.md');
  });
});
