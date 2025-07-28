import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { type Sandbox, addFiles, createSandbox, runTypescript } from '@buster/sandbox';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('tree-script integration test', () => {
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
    const scriptPath = path.join(__dirname, 'tree-script.ts');
    scriptContent = await fs.readFile(scriptPath, 'utf-8');

    // Create test files and directories in sandbox using addFiles
    const testFiles = [
      { path: 'README.md', content: '# Test Project', destination: 'README.md' },
      { path: 'package.json', content: '{"name": "test"}', destination: 'package.json' },
      { path: '.gitignore', content: 'node_modules/\ndist/', destination: '.gitignore' },
      { path: '.env', content: 'SECRET=123', destination: '.env' },
      {
        path: 'src/index.ts',
        content: 'export const hello = "world";',
        destination: 'src/index.ts',
      },
      {
        path: 'src/utils/helper.ts',
        content: 'export function help() {}',
        destination: 'src/utils/helper.ts',
      },
      {
        path: 'src/utils/logger.ts',
        content: 'export function log() {}',
        destination: 'src/utils/logger.ts',
      },
      {
        path: 'tests/index.test.ts',
        content: 'test("hello", () => {});',
        destination: 'tests/index.test.ts',
      },
      {
        path: 'tests/utils/helper.test.ts',
        content: 'test("help", () => {});',
        destination: 'tests/utils/helper.test.ts',
      },
      {
        path: 'node_modules/pkg/index.js',
        content: 'module.exports = {};',
        destination: 'node_modules/pkg/index.js',
      },
      {
        path: 'dist/index.js',
        content: 'console.log("built");',
        destination: 'dist/index.js',
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

  it.skipIf(!hasApiKey)('should generate tree output for current directory', async () => {
    const args = Buffer.from(JSON.stringify({ path: '.' })).toString('base64');
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [args],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.output).toBeDefined();
    expect(output.command).toBe('tree "."');

    // Check structure
    expect(output.output).toContain('.');
    expect(output.output).toContain('src');
    expect(output.output).toContain('tests');
    expect(output.output).toContain('README.md');
    expect(output.output).toContain('package.json');
  });

  it.skipIf(!hasApiKey)('should respect gitignore option', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [
        Buffer.from(JSON.stringify({ path: '.', options: { gitignore: true } })).toString('base64'),
      ],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.command).toContain('--gitignore');

    // When using --gitignore, node_modules and dist should not appear
    expect(output.output).not.toContain('node_modules');
    expect(output.output).not.toContain('dist');

    // But other files should still be there
    expect(output.output).toContain('src');
    expect(output.output).toContain('tests');
  });

  it.skipIf(!hasApiKey)('should limit depth with maxDepth option', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [
        Buffer.from(JSON.stringify({ path: '.', options: { maxDepth: 1 } })).toString('base64'),
      ],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.command).toContain('-L 1');

    // With depth 1, we should see directories but not their contents
    expect(output.output).toContain('src');
    expect(output.output).toContain('tests');
    expect(output.output).not.toContain('index.ts');
    expect(output.output).not.toContain('helper.ts');
  });

  it.skipIf(!hasApiKey)('should show only directories with dirsOnly option', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [
        Buffer.from(JSON.stringify({ path: '.', options: { dirsOnly: true } })).toString('base64'),
      ],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.command).toContain('-d');

    // Should only show directories
    expect(output.output).toContain('src');
    expect(output.output).toContain('tests');
    expect(output.output).not.toContain('README.md');
    expect(output.output).not.toContain('package.json');
  });

  it.skipIf(!hasApiKey)('should filter by pattern', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [
        Buffer.from(JSON.stringify({ path: '.', options: { pattern: '*.ts' } })).toString('base64'),
      ],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.command).toContain('-P "*.ts"');

    // Should show TypeScript files
    expect(output.output).toContain('index.ts');
    expect(output.output).toContain('helper.ts');

    // Should not show non-TypeScript files
    expect(output.output).not.toContain('README.md');
    expect(output.output).not.toContain('package.json');
  });

  it.skipIf(!hasApiKey)('should handle specific directories', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [Buffer.from(JSON.stringify({ path: 'src' })).toString('base64')],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.output).toContain('src');
    expect(output.output).toContain('index.ts');
    expect(output.output).toContain('utils');
    expect(output.output).toContain('helper.ts');

    // Should not show content outside src
    expect(output.output).not.toContain('tests');
    expect(output.output).not.toContain('README.md');
  });

  it.skipIf(!hasApiKey)('should handle non-existent directory', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [Buffer.from(JSON.stringify({ path: 'nonexistent' })).toString('base64')],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(false);
    expect(output.error).toBeDefined();
    expect(output.command).toBe('tree "nonexistent"');
  });

  it.skipIf(!hasApiKey)('should handle nested directory paths', async () => {
    const result = await runTypescript(sandbox, scriptContent, {
      argv: [Buffer.from(JSON.stringify({ path: 'src/utils' })).toString('base64')],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.output).toContain('utils');
    expect(output.output).toContain('helper.ts');
    expect(output.output).toContain('logger.ts');

    // Should not show parent directory content
    expect(output.output).not.toContain('index.ts');
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    // Get the absolute path of src directory in the sandbox
    const pwdScript = `console.log(process.cwd() + '/src')`;
    const pwdResult = await runTypescript(sandbox, pwdScript);
    const absolutePath = pwdResult.result.trim();

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [Buffer.from(JSON.stringify({ path: absolutePath })).toString('base64')],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    expect(output.command).toBe(`tree "${absolutePath}"`);
    expect(output.output).toContain('index.ts');
    expect(output.output).toContain('utils');
  });

  it.skipIf(!hasApiKey)('should handle very deep directory structure', async () => {
    // Create a deep directory structure
    await addFiles(sandbox, [
      {
        path: 'deep/level1/level2/level3/level4/file.txt',
        content: 'deep file',
        destination: 'deep/level1/level2/level3/level4/file.txt',
      },
    ]);

    const result = await runTypescript(sandbox, scriptContent, {
      argv: [
        Buffer.from(JSON.stringify({ path: 'deep', options: { maxDepth: 3 } })).toString('base64'),
      ],
    });
    const output = JSON.parse(result.result);

    expect(output.success).toBe(true);
    // Should show up to level 3
    expect(output.output).toContain('level1');
    expect(output.output).toContain('level2');
    expect(output.output).toContain('level3');
    // Should not show level4 due to maxDepth
    expect(output.output).not.toContain('level4');
  });
});
