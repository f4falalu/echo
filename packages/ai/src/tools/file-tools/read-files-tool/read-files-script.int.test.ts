import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { type Sandbox, createSandbox } from '@buster/sandbox';
import { addFiles } from '@buster/sandbox';
import { runTypescript } from '@buster/sandbox';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('read-files-script integration test', () => {
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
    const scriptPath = path.join(__dirname, 'read-files-script.ts');
    scriptContent = await fs.readFile(scriptPath, 'utf-8');

    // Create test files in sandbox using addFiles
    const testFiles = [
      { path: 'simple.txt', content: 'Simple file content', destination: 'simple.txt' },
      { path: 'multiline.txt', content: 'Line 1\nLine 2\nLine 3', destination: 'multiline.txt' },
      { path: 'empty.txt', content: '', destination: 'empty.txt' },
      {
        path: 'nested/file.txt',
        content: 'Nested file content',
        destination: 'nested/file.txt',
      },
      {
        path: 'special-chars.txt',
        content: 'Special characters: @#$%^&*()_+',
        destination: 'special-chars.txt',
      },
      {
        path: 'unicode.txt',
        content: 'Unicode: 你好世界 🌍 émojis',
        destination: 'unicode.txt',
      },
    ];

    // Create a large file with more than 1000 lines
    const largeContent = Array.from({ length: 1500 }, (_, i) => `Line ${i + 1}`).join('\n');
    testFiles.push({
      path: 'large.txt',
      content: largeContent,
      destination: 'large.txt',
    });

    await addFiles(sandbox, testFiles);
  }, 60000); // 60 second timeout for sandbox creation

  afterAll(async () => {
    // Clean up the sandbox
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should return empty array when no files provided', async () => {
    const result = await runTypescript(sandbox, scriptContent);
    const output = JSON.parse(result.result);

    expect(output).toEqual([{
      success: false,
      filePath: '',
      error: 'No file paths provided'
    }]);
  });

  it.skipIf(!hasApiKey)('should read a single file successfully', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['simple.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      filePath: 'simple.txt',
      content: 'Simple file content',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should read multiple files concurrently', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['simple.txt', 'multiline.txt', 'empty.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(3);
    expect(output[0]).toEqual({
      success: true,
      filePath: 'simple.txt',
      content: 'Simple file content',
      truncated: false,
    });
    expect(output[1]).toEqual({
      success: true,
      filePath: 'multiline.txt',
      content: 'Line 1\nLine 2\nLine 3',
      truncated: false,
    });
    expect(output[2]).toEqual({
      success: true,
      filePath: 'empty.txt',
      content: '',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should handle nested file paths', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['nested/file.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      filePath: 'nested/file.txt',
      content: 'Nested file content',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should handle non-existent files gracefully', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['nonexistent.txt', 'also-not-here.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(2);
    expect(output[0]).toEqual({
      success: false,
      filePath: 'nonexistent.txt',
      error: 'File not found',
    });
    expect(output[1]).toEqual({
      success: false,
      filePath: 'also-not-here.txt',
      error: 'File not found',
    });
  });

  it.skipIf(!hasApiKey)('should truncate large files', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['large.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0].success).toBe(true);
    expect(output[0].filePath).toBe('large.txt');
    expect(output[0].truncated).toBe(true);

    const lines = output[0].content.split('\n');
    expect(lines).toHaveLength(1000);
    expect(lines[0]).toBe('Line 1');
    expect(lines[999]).toBe('Line 1000');
  });

  it.skipIf(!hasApiKey)('should handle special characters in file content', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['special-chars.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      filePath: 'special-chars.txt',
      content: 'Special characters: @#$%^&*()_+',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should handle unicode content', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['unicode.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      filePath: 'unicode.txt',
      content: 'Unicode: 你好世界 🌍 émojis',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should handle mixed successful and failed reads', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['simple.txt', 'nonexistent.txt', 'multiline.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(3);
    expect(output[0].success).toBe(true);
    expect(output[0].filePath).toBe('simple.txt');
    expect(output[1].success).toBe(false);
    expect(output[1].filePath).toBe('nonexistent.txt');
    expect(output[1].error).toBe('File not found');
    expect(output[2].success).toBe(true);
    expect(output[2].filePath).toBe('multiline.txt');
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    // Create a file with an absolute-style path in the sandbox
    const testDir = 'absolute-test';
    await addFiles(sandbox, [
      {
        path: `${testDir}/test.txt`,
        content: 'Absolute path test',
        destination: `${testDir}/test.txt`,
      },
    ]);

    // Get the absolute path in the sandbox
    const pwdScript = `console.log(process.cwd() + '/${testDir}/test.txt')`;
    const pwdResult = await runTypescript(sandbox, pwdScript);
    const absolutePath = pwdResult.result.trim();

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [absolutePath],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      filePath: absolutePath,
      content: 'Absolute path test',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should handle files with various line endings', async () => {
    // Create files with different line endings
    await addFiles(sandbox, [
      {
        path: 'crlf.txt',
        content: 'Line 1\r\nLine 2\r\nLine 3',
        destination: 'crlf.txt',
      },
      {
        path: 'lf.txt',
        content: 'Line 1\nLine 2\nLine 3',
        destination: 'lf.txt',
      },
    ]);

    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['crlf.txt', 'lf.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(2);
    // Both should be read successfully
    expect(output[0].success).toBe(true);
    expect(output[1].success).toBe(true);
  });

  it.skipIf(!hasApiKey)('should handle file paths with spaces', async () => {
    await addFiles(sandbox, [
      {
        path: 'file with spaces.txt',
        content: 'Content with spaces in filename',
        destination: 'file with spaces.txt',
      },
    ]);

    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['file with spaces.txt'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0]).toEqual({
      success: true,
      filePath: 'file with spaces.txt',
      content: 'Content with spaces in filename',
      truncated: false,
    });
  });
});
