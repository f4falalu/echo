import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { type Sandbox, createSandbox } from '@buster/sandbox';
import { addFiles } from '@buster/sandbox';
import { runTypescript } from '@buster/sandbox';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('ls-files-script integration test', () => {
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
    const scriptPath = path.join(__dirname, 'ls-files-script.ts');
    scriptContent = await fs.readFile(scriptPath, 'utf-8');

    // Create test files and directories in sandbox using addFiles
    const testFiles = [
      { path: 'file1.txt', content: 'Content 1', destination: 'file1.txt' },
      { path: 'file2.txt', content: 'Content 2', destination: 'file2.txt' },
      { path: '.hidden', content: 'Hidden file', destination: '.hidden' },
      {
        path: 'subdir1/nested1.txt',
        content: 'Nested content 1',
        destination: 'subdir1/nested1.txt',
      },
      {
        path: 'subdir1/nested2.txt',
        content: 'Nested content 2',
        destination: 'subdir1/nested2.txt',
      },
      { path: 'subdir2/another.txt', content: 'Another file', destination: 'subdir2/another.txt' },
      {
        path: 'deep/level1/file1.txt',
        content: 'Level 1 file',
        destination: 'deep/level1/file1.txt',
      },
      {
        path: 'deep/level1/level2/file2.txt',
        content: 'Level 2 file',
        destination: 'deep/level1/level2/file2.txt',
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

  it.skipIf(!hasApiKey)('should list current directory when no arguments provided', async () => {
    const result = await runTypescript(sandbox, scriptContent);
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(1);
    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe('.');

    const entries = output[0].entries;
    expect(entries.some((e: any) => e.name === 'file1.txt')).toBe(true);
    expect(entries.some((e: any) => e.name === 'file2.txt')).toBe(true);
    expect(entries.some((e: any) => e.name === 'subdir1')).toBe(true);
    expect(entries.some((e: any) => e.name === 'subdir2')).toBe(true);
    expect(entries.some((e: any) => e.name === '.hidden')).toBe(false); // Hidden by default
  });

  it.skipIf(!hasApiKey)('should list specific directories', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['subdir1', 'subdir2'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(2);

    // Check subdir1
    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe('subdir1');
    expect(output[0].entries.some((e: any) => e.name === 'nested1.txt')).toBe(true);
    expect(output[0].entries.some((e: any) => e.name === 'nested2.txt')).toBe(true);

    // Check subdir2
    expect(output[1].success).toBe(true);
    expect(output[1].path).toBe('subdir2');
    expect(output[1].entries.some((e: any) => e.name === 'another.txt')).toBe(true);
  });

  it.skipIf(!hasApiKey)('should show detailed information with -l flag', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['-l', '.'],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);

    const file1 = output[0].entries.find((e: any) => e.name === 'file1.txt');
    expect(file1).toBeDefined();
    expect(file1.permissions).toBeDefined();
    expect(file1.size).toBeDefined();
    expect(file1.modified).toBeDefined();
    expect(file1.owner).toBeDefined();
    expect(file1.group).toBeDefined();
  });

  it.skipIf(!hasApiKey)('should show hidden files with -a flag', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['-a'],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);

    const entries = output[0].entries;
    expect(entries.some((e: any) => e.name === '.hidden')).toBe(true);
    expect(entries.some((e: any) => e.name === '.')).toBe(true);
    expect(entries.some((e: any) => e.name === '..')).toBe(true);
  });

  it.skipIf(!hasApiKey)('should combine multiple flags', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['-la', 'subdir1'],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe('subdir1');

    const entries = output[0].entries;
    // Should have detailed info
    expect(entries[0].permissions).toBeDefined();
    // Should show hidden entries
    expect(entries.some((e: any) => e.name === '.')).toBe(true);
  });

  it.skipIf(!hasApiKey)('should handle recursive listing with -R flag', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['-R', 'deep'],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    expect(output[0].path).toBe('deep');

    // With recursive flag, ls output format changes, but the command should still work
    expect(output[0].entries).toBeDefined();
  });

  it.skipIf(!hasApiKey)('should handle human-readable sizes with -h flag', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['-lh', '.'],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);

    // With -h flag, sizes should be human-readable (e.g., "1.2K" instead of "1234")
    const entries = output[0].entries;
    expect(entries[0].size).toBeDefined();
  });

  it.skipIf(!hasApiKey)('should handle non-existent paths gracefully', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['nonexistent', 'doesnotexist'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(2);
    expect(output[0].success).toBe(false);
    expect(output[0].error).toBe('Path not found');
    expect(output[1].success).toBe(false);
    expect(output[1].error).toBe('Path not found');
  });

  it.skipIf(!hasApiKey)('should handle mixed valid and invalid paths', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['subdir1', 'nonexistent', '.'],
    });
    const output = JSON.parse(result.result);

    expect(output).toHaveLength(3);
    expect(output[0].success).toBe(true); // subdir1 exists
    expect(output[1].success).toBe(false); // nonexistent
    expect(output[2].success).toBe(true); // current dir exists
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    // Create a directory with an absolute-style path in the sandbox
    const testDir = 'absolute-test-dir';
    await addFiles(sandbox, [
      {
        path: `${testDir}/tmpfile.txt`,
        content: 'Temp file',
        destination: `${testDir}/tmpfile.txt`,
      },
    ]);

    // Get the absolute path of the test directory in the sandbox
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [testDir],
    });
    const output = JSON.parse(result.result);

    // First, verify the directory exists
    expect(output[0].success).toBe(true);
    expect(output[0].entries.some((e: any) => e.name === 'tmpfile.txt')).toBe(true);

    // Now test with the absolute path (using pwd to get current directory)
    const pwdScript = `console.log(process.cwd() + '/${testDir}')`;
    const pwdResult = await runTypescript(sandbox, pwdScript);
    const absolutePath = pwdResult.result.trim();

    const absoluteResult = await runTypescript(sandbox, scriptContent, {
      argv: [absolutePath],
    });
    const absoluteOutput = JSON.parse(absoluteResult.result);

    expect(absoluteOutput[0].success).toBe(true);
    expect(absoluteOutput[0].path).toBe(absolutePath);
    expect(absoluteOutput[0].entries.some((e: any) => e.name === 'tmpfile.txt')).toBe(true);
  });

  it.skipIf(!hasApiKey)('should handle all flags combined', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: ['-laRh', '.'],
    });
    const output = JSON.parse(result.result);

    expect(output[0].success).toBe(true);
    // Should have all options applied
    const entries = output[0].entries;
    expect(entries.some((e: any) => e.name === '.')).toBe(true); // -a shows hidden
    expect(entries[0].permissions).toBeDefined(); // -l shows details
    // -R and -h are also applied
  });
});
