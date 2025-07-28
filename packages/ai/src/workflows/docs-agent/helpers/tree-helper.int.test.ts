import { type Sandbox, addFiles, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { getRepositoryTree, getRepositoryTreeFromContext } from './tree-helper';

describe('tree-helper integration', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;

  beforeAll(async () => {
    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });

    // Create test files and directories in sandbox using addFiles
    const testFiles = [
      { path: 'README.md', content: '# Test Repository', destination: 'README.md' },
      { path: 'package.json', content: '{"name": "test-repo"}', destination: 'package.json' },
      { path: '.gitignore', content: 'node_modules/\ndist/\n.env', destination: '.gitignore' },
      {
        path: 'src/index.ts',
        content: 'export const main = () => console.log("Hello");',
        destination: 'src/index.ts',
      },
      {
        path: 'src/utils/helper.ts',
        content: 'export const helper = () => {};',
        destination: 'src/utils/helper.ts',
      },
      {
        path: 'tests/index.test.ts',
        content: 'describe("test", () => { it("works", () => {}); });',
        destination: 'tests/index.test.ts',
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
      {
        path: 'docs/README.md',
        content: '# Documentation',
        destination: 'docs/README.md',
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

  describe('getRepositoryTree', () => {
    it.skipIf(!hasApiKey)('should generate tree output for current directory', async () => {
      const result = await getRepositoryTree(sandbox, '.', { gitignore: false });

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.command).toContain('tree');

      // Check that output contains expected structure
      if (result.output) {
        expect(result.output).toContain('src');
        expect(result.output).toContain('tests');
        expect(result.output).toContain('docs');
        expect(result.output).toContain('README.md');
        expect(result.output).toContain('package.json');
        expect(result.output).toContain('index.ts');
      }
    });

    it.skipIf(!hasApiKey)('should respect gitignore option', async () => {
      const result = await getRepositoryTree(sandbox, '.', { gitignore: true });

      expect(result.success).toBe(true);
      expect(result.command).toContain('--gitignore');

      // With gitignore, node_modules and dist should not appear
      if (result.output) {
        expect(result.output).not.toContain('node_modules');
        expect(result.output).not.toContain('dist');
        // But other directories should be visible
        expect(result.output).toContain('src');
        expect(result.output).toContain('tests');
      }
    });

    it.skipIf(!hasApiKey)('should respect maxDepth option', async () => {
      const result = await getRepositoryTree(sandbox, '.', {
        gitignore: true,
        maxDepth: 1,
      });

      expect(result.success).toBe(true);
      expect(result.command).toContain('-L 1');

      // With maxDepth 1, we should see directories but not their contents
      if (result.output) {
        expect(result.output).toContain('src');
        expect(result.output).toContain('tests');
        expect(result.output).not.toContain('index.ts');
        expect(result.output).not.toContain('helper.ts');
      }
    });

    it.skipIf(!hasApiKey)('should handle specific directory paths', async () => {
      const result = await getRepositoryTree(sandbox, 'src');

      expect(result.success).toBe(true);

      if (result.output) {
        expect(result.output).toContain('src');
        expect(result.output).toContain('index.ts');
        expect(result.output).toContain('utils');
        expect(result.output).toContain('helper.ts');
        // Should not show content outside src
        expect(result.output).not.toContain('tests');
        expect(result.output).not.toContain('package.json');
      }
    });

    it.skipIf(!hasApiKey)('should handle non-existent directory', async () => {
      const result = await getRepositoryTree(sandbox, 'non-existent-dir');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it.skipIf(!hasApiKey)('should handle dirsOnly option', async () => {
      const result = await getRepositoryTree(sandbox, '.', { dirsOnly: true });

      expect(result.success).toBe(true);
      expect(result.command).toContain('-d');

      if (result.output) {
        // Should only show directories
        expect(result.output).toContain('src');
        expect(result.output).toContain('tests');
        expect(result.output).not.toContain('README.md');
        expect(result.output).not.toContain('package.json');
      }
    });

    it.skipIf(!hasApiKey)('should handle pattern option', async () => {
      const result = await getRepositoryTree(sandbox, '.', { pattern: '*.ts' });

      expect(result.success).toBe(true);
      expect(result.command).toContain('-P "*.ts"');

      if (result.output) {
        // Should show TypeScript files
        expect(result.output).toContain('index.ts');
        expect(result.output).toContain('helper.ts');
        // Should not show non-TypeScript files
        expect(result.output).not.toContain('package.json');
      }
    });

    it.skipIf(!hasApiKey)('should handle combined options', async () => {
      const result = await getRepositoryTree(sandbox, '.', {
        gitignore: true,
        maxDepth: 2,
        pattern: '*.test.ts',
      });

      expect(result.success).toBe(true);
      expect(result.command).toContain('--gitignore');
      expect(result.command).toContain('-L 2');
      expect(result.command).toContain('-P "*.test.ts"');
    });
  });

  describe('getRepositoryTreeFromContext', () => {
    it.skipIf(!hasApiKey)('should work with runtime context', async () => {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

      const result = await getRepositoryTreeFromContext(runtimeContext, 'src');

      expect(result).not.toBeNull();
      expect(result?.success).toBe(true);
      if (result?.output) {
        expect(result.output).toContain('index.ts');
        expect(result.output).toContain('utils');
      }
    });

    it.skipIf(!hasApiKey)('should return null without sandbox in context', async () => {
      const runtimeContext = new RuntimeContext();
      // Don't set sandbox

      const result = await getRepositoryTreeFromContext(runtimeContext);

      expect(result).toBeNull();
    });
  });
});
