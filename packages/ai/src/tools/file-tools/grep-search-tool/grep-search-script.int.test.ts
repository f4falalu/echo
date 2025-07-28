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

  it.skipIf(!hasApiKey)('should return empty array when no searches provided', async () => {
    const result = await runTypescript(sandbox, scriptContent);
    const output = JSON.parse(result.result);

    expect(output).toEqual([]);
  });

  it.skipIf(!hasApiKey)('should search for patterns in single file', async () => {
    const searches = [
      {
        path: 'file1.txt',
        pattern: 'test',
        recursive: false,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe('file1.txt');
    expect(output[0].pattern).toBe('test');
    expect(output[0].matchCount).toBe(2);
    expect(output[0].matches).toHaveLength(2);
    expect(output[0].matches[0]).toEqual({
      file: 'file1.txt',
      lineNumber: 2,
      content: 'This is a test file',
    });
    expect(output[0].matches[1]).toEqual({
      file: 'file1.txt',
      lineNumber: 4,
      content: 'Another test line',
    });
  });

  it.skipIf(!hasApiKey)('should handle case-insensitive searches', async () => {
    const searches = [
      {
        path: 'case-test.txt',
        pattern: 'hello',
        ignoreCase: true,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBe(4); // All lines match
    expect(output[0].matches.map((m: any) => m.lineNumber)).toEqual([1, 2, 3, 4]);
  });

  it.skipIf(!hasApiKey)('should handle recursive searches', async () => {
    const searches = [
      {
        path: '.',
        pattern: 'Hello',
        recursive: true,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBeGreaterThan(0);

    // Check that matches come from multiple files
    const fileNames = output[0].matches.map((m: any) => m.file);
    const uniqueFiles = [...new Set(fileNames)];
    expect(uniqueFiles.length).toBeGreaterThan(1);

    // Should find matches in main files and subdirectory
    expect(fileNames.some((f: string) => f === './file1.txt')).toBe(true);
    expect(fileNames.some((f: string) => f === './file2.txt')).toBe(true);
    expect(fileNames.some((f: string) => f.includes('subdir/'))).toBe(true);
  });

  it.skipIf(!hasApiKey)('should handle whole word matches', async () => {
    const searches = [
      {
        path: 'word-test.txt',
        pattern: 'test',
        wordMatch: true,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBe(3); // Should match "test" as whole word, not "testing", "tested", or "tester"
    expect(output[0].matches[0].content).toBe('test testing tested');
    expect(output[0].matches[1].content).toBe('word test word');
    expect(output[0].matches[2].content).toBe('test');
  });

  it.skipIf(!hasApiKey)('should handle fixed string searches (literal)', async () => {
    const searches = [
      {
        path: 'special-chars.txt',
        pattern: '$10.99',
        fixedStrings: true,
        lineNumbers: true,
      },
      {
        path: 'special-chars.txt',
        pattern: 'test.*',
        fixedStrings: true,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(2);
    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBe(1);
    expect(output[0].matches[0].content).toBe('Price: $10.99');

    expect(output[1].success).toBe(true);
    expect(output[1].matchCount).toBe(1);
    expect(output[1].matches[0].content).toBe('Pattern: test.*');
  });

  it.skipIf(!hasApiKey)('should handle inverted matches', async () => {
    const searches = [
      {
        path: 'invert-test.txt',
        pattern: 'test',
        invertMatch: true,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBe(2); // Lines without "test"
    expect(output[0].matches[0]).toEqual({
      file: 'invert-test.txt',
      lineNumber: 2,
      content: 'Line without pattern',
    });
    expect(output[0].matches[1]).toEqual({
      file: 'invert-test.txt',
      lineNumber: 4,
      content: 'No match here',
    });
  });

  it.skipIf(!hasApiKey)('should handle max count limit', async () => {
    const searches = [
      {
        path: 'many-matches.txt',
        pattern: 'match',
        maxCount: 3,
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBe(3); // Limited by maxCount
    expect(output[0].matches).toHaveLength(3);
  });

  it.skipIf(!hasApiKey)('should handle no matches found', async () => {
    const searches = [
      {
        path: 'file1.txt',
        pattern: 'nonexistent',
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0]).toEqual({
      success: true,
      path: 'file1.txt',
      pattern: 'nonexistent',
      matches: [],
      matchCount: 0,
    });
  });

  it.skipIf(!hasApiKey)('should handle path not found errors', async () => {
    const searches = [
      {
        path: 'nonexistent.txt',
        pattern: 'test',
      },
      {
        path: 'nonexistent-dir',
        pattern: 'test',
        recursive: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(2);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toBe('Path does not exist: nonexistent.txt');
    expect(output[1].success).toBe(false);
    expect(output[1].error).toBe('Path does not exist: nonexistent-dir');
  });

  it.skipIf(!hasApiKey)('should handle multiple searches', async () => {
    const searches = [
      {
        path: 'file1.txt',
        pattern: 'Hello',
        lineNumbers: true,
      },
      {
        path: 'file2.txt',
        pattern: 'Hello',
        lineNumbers: true,
      },
      {
        path: 'case-test.txt',
        pattern: 'HELLO',
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(3);

    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe('file1.txt');
    expect(output[0].matchCount).toBe(1);

    expect(output[1].success).toBe(true);
    expect(output[1].path).toBe('file2.txt');
    expect(output[1].matchCount).toBe(1);

    expect(output[2].success).toBe(true);
    expect(output[2].path).toBe('case-test.txt');
    expect(output[2].matchCount).toBe(2); // "HELLO World" and "HELLO WORLD"
  });

  it.skipIf(!hasApiKey)('should handle searches without line numbers', async () => {
    const searches = [
      {
        path: 'file1.txt',
        pattern: 'test',
        lineNumbers: false,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matches).toHaveLength(2);
    // Without line numbers, matches shouldn't have lineNumber property
    expect(output[0].matches[0].lineNumber).toBeUndefined();
    expect(output[0].matches[0].content).toBe('This is a test file');
    expect(output[0].matches[1].content).toBe('Another test line');
  });

  it.skipIf(!hasApiKey)('should handle invalid input gracefully', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['not-json'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toContain('Failed to parse input');
  });

  it.skipIf(!hasApiKey)('should handle non-array input', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['{"not": "array"}'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toBe('Invalid input: expected array of searches');
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    // First get the current working directory in the sandbox
    const pwdScript = `console.log(process.cwd())`;
    const pwdResult = await runTypescript(sandbox, pwdScript);
    const cwd = pwdResult.result.trim();

    const absolutePath = `${cwd}/file1.txt`;

    const searches = [
      {
        path: absolutePath,
        pattern: 'test',
        lineNumbers: true,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe(absolutePath);
    expect(output[0].matchCount).toBe(2);
  });

  it.skipIf(!hasApiKey)('should handle all options combined', async () => {
    // Create a specific test file for this case
    const testContent = `TEST line 1
test line 2
TEST line 3
not matching line
test line 5
TEST line 6`;

    await addFiles(sandbox, [
      { path: 'combined-test.txt', content: testContent, destination: 'combined-test.txt' },
    ]);

    const searches = [
      {
        path: 'combined-test.txt',
        pattern: 'test',
        ignoreCase: true,
        wordMatch: true,
        lineNumbers: true,
        maxCount: 4,
      },
    ];

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [JSON.stringify(searches)],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].matchCount).toBe(4); // Limited by maxCount
    // Should match both "test" and "TEST" (case insensitive) as whole words
  });
});
