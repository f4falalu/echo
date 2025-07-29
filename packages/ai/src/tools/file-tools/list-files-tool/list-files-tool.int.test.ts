import { createSandbox } from '@buster/sandbox';
import { addFiles } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { listFiles } from './list-files-tool';

describe.sequential('list-files-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sharedSandbox: any;

  beforeAll(async () => {
    if (hasApiKey) {
      sharedSandbox = await createSandbox({
        language: 'typescript',
      });
    }
  }, 120000);

  afterAll(async () => {
    if (sharedSandbox) {
      await sharedSandbox.delete();
    }
  }, 65000);

  function getTestDir() {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  describe('with sandbox', () => {
    (hasApiKey ? it : it.skip)(
      'should list files in current directory',
      async () => {
        const testDir = getTestDir();

        // Create test directory structure
        const createDirCode = `
          const fs = require('fs');
          fs.mkdirSync('${testDir}', { recursive: true });
        `;
        await sharedSandbox.process.codeRun(createDirCode);

        // Create test files and directories in sandbox using addFiles
        const testFiles = [
          { path: 'file1.txt', content: 'Content 1', destination: `${testDir}/file1.txt` },
          { path: 'file2.txt', content: 'Content 2', destination: `${testDir}/file2.txt` },
          { path: '.hidden', content: 'Hidden file', destination: `${testDir}/.hidden` },
          {
            path: 'subdir1/nested1.txt',
            content: 'Nested content 1',
            destination: `${testDir}/subdir1/nested1.txt`,
          },
          {
            path: 'subdir1/nested2.txt',
            content: 'Nested content 2',
            destination: `${testDir}/subdir1/nested2.txt`,
          },
          {
            path: 'subdir2/another.txt',
            content: 'Another file',
            destination: `${testDir}/subdir2/another.txt`,
          },
          {
            path: 'deep/level1/file1.txt',
            content: 'Level 1 file',
            destination: `${testDir}/deep/level1/file1.txt`,
          },
          {
            path: 'deep/level1/level2/file2.txt',
            content: 'Level 2 file',
            destination: `${testDir}/deep/level1/level2/file2.txt`,
          },
        ];

        await addFiles(sharedSandbox, testFiles);

        const runtimeContext = new RuntimeContext();
        runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

        const result = await listFiles.execute({
          context: {
            paths: [`${testDir}`],
          },
          runtimeContext,
        });

        expect(result.results).toHaveLength(1);
        expect(result.results[0]?.status).toBe('success');

        if (result.results[0]?.status === 'success') {
          const output = result.results[0].output;
          expect(output).toContain('file1.txt');
          expect(output).toContain('file2.txt');
          expect(output).toContain('subdir1');
          expect(output).toContain('subdir2');
          expect(output).not.toContain('.hidden'); // Hidden by default with gitignore
        }
      },
      65000
    );

    (hasApiKey ? it : it.skip)(
      'should list files with depth limit',
      async () => {
        const testDir = getTestDir();

        // Create test directory structure
        const createDirCode = `
          const fs = require('fs');
          fs.mkdirSync('${testDir}', { recursive: true });
        `;
        await sharedSandbox.process.codeRun(createDirCode);

        // Create test files and directories in sandbox using addFiles
        const testFiles = [
          { path: 'file1.txt', content: 'Content 1', destination: `${testDir}/file1.txt` },
          { path: 'file2.txt', content: 'Content 2', destination: `${testDir}/file2.txt` },
          {
            path: 'subdir1/nested1.txt',
            content: 'Nested content 1',
            destination: `${testDir}/subdir1/nested1.txt`,
          },
          {
            path: 'subdir1/nested2.txt',
            content: 'Nested content 2',
            destination: `${testDir}/subdir1/nested2.txt`,
          },
          {
            path: 'deep/level1/file1.txt',
            content: 'Level 1 file',
            destination: `${testDir}/deep/level1/file1.txt`,
          },
          {
            path: 'deep/level1/level2/file2.txt',
            content: 'Level 2 file',
            destination: `${testDir}/deep/level1/level2/file2.txt`,
          },
        ];

        await addFiles(sharedSandbox, testFiles);

        const runtimeContext = new RuntimeContext();
        runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

        const result = await listFiles.execute({
          context: {
            paths: [`${testDir}`],
            options: {
              depth: 2,
            },
          },
          runtimeContext,
        });

        expect(result.results[0]?.status).toBe('success');

        if (result.results[0]?.status === 'success') {
          const output = result.results[0].output;
          expect(output).toContain('file1.txt');
          expect(output).toContain('file2.txt');
          expect(output).toContain('subdir1');
          expect(output).toContain('nested1.txt');
          expect(output).toContain('nested2.txt');
          expect(output).toContain('level1');
          // Level 2 should not be shown with depth 2
          expect(output).not.toContain('level2');
        }
      },
      65000
    );

    (hasApiKey ? it : it.skip)(
      'should show hidden files with all option',
      async () => {
        const testDir = getTestDir();

        // Create test directory structure
        const createDirCode = `
          const fs = require('fs');
          fs.mkdirSync('${testDir}', { recursive: true });
        `;
        await sharedSandbox.process.codeRun(createDirCode);

        // Create test files and directories in sandbox using addFiles
        const testFiles = [
          { path: 'file1.txt', content: 'Content 1', destination: `${testDir}/file1.txt` },
          { path: '.hidden', content: 'Hidden file', destination: `${testDir}/.hidden` },
          { path: '.gitignore', content: '*.log', destination: `${testDir}/.gitignore` },
        ];

        await addFiles(sharedSandbox, testFiles);

        const runtimeContext = new RuntimeContext();
        runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

        const result = await listFiles.execute({
          context: {
            paths: [`${testDir}`],
            options: {
              all: true,
            },
          },
          runtimeContext,
        });

        expect(result.results[0]?.status).toBe('success');

        if (result.results[0]?.status === 'success') {
          const output = result.results[0].output;
          expect(output).toContain('.hidden');
          expect(output).toContain('.gitignore');
        }
      },
      65000
    );

    (hasApiKey ? it : it.skip)(
      'should handle multiple paths',
      async () => {
        const testDir = getTestDir();

        // Create test directory structure
        const createDirCode = `
          const fs = require('fs');
          fs.mkdirSync('${testDir}/subdir1', { recursive: true });
          fs.mkdirSync('${testDir}/subdir2', { recursive: true });
        `;
        await sharedSandbox.process.codeRun(createDirCode);

        // Create test files and directories in sandbox using addFiles
        const testFiles = [
          {
            path: 'nested1.txt',
            content: 'Nested content 1',
            destination: `${testDir}/subdir1/nested1.txt`,
          },
          {
            path: 'nested2.txt',
            content: 'Nested content 2',
            destination: `${testDir}/subdir1/nested2.txt`,
          },
          {
            path: 'another.txt',
            content: 'Another file',
            destination: `${testDir}/subdir2/another.txt`,
          },
        ];

        await addFiles(sharedSandbox, testFiles);

        const runtimeContext = new RuntimeContext();
        runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

        const result = await listFiles.execute({
          context: {
            paths: [`${testDir}/subdir1`, `${testDir}/subdir2`],
          },
          runtimeContext,
        });

        expect(result.results).toHaveLength(2);

        // Check subdir1
        expect(result.results[0]?.status).toBe('success');
        if (result.results[0]?.status === 'success') {
          const output = result.results[0].output;
          expect(output).toContain('nested1.txt');
          expect(output).toContain('nested2.txt');
        }

        // Check subdir2
        expect(result.results[1]?.status).toBe('success');
        if (result.results[1]?.status === 'success') {
          const output = result.results[1].output;
          expect(output).toContain('another.txt');
        }
      },
      65000
    );

    (hasApiKey ? it : it.skip)(
      'should handle non-existent paths',
      async () => {
        const runtimeContext = new RuntimeContext();
        runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

        const result = await listFiles.execute({
          context: {
            paths: ['nonexistent-dir', 'also-nonexistent'],
          },
          runtimeContext,
        });

        expect(result.results).toHaveLength(2);
        expect(result.results[0]?.status).toBe('error');
        expect(result.results[1]?.status).toBe('error');

        if (result.results[0]?.status === 'error') {
          expect(result.results[0].error_message).toContain('[error opening dir]');
        }
        if (result.results[1]?.status === 'error') {
          expect(result.results[1].error_message).toContain('[error opening dir]');
        }
      },
      65000
    );

    (hasApiKey ? it : it.skip)(
      'should handle empty paths array',
      async () => {
        const runtimeContext = new RuntimeContext();
        runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

        const result = await listFiles.execute({
          context: {
            paths: [],
          },
          runtimeContext,
        });

        expect(result.results).toHaveLength(0);
      },
      65000
    );
  });

  describe('without sandbox', () => {
    it('should return error when sandbox is not available', async () => {
      const runtimeContext = new RuntimeContext();
      // Don't set sandbox in runtime context

      const result = await listFiles.execute({
        context: {
          paths: ['.', '/some/path'],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.status).toBe('error');
      expect(result.results[1]?.status).toBe('error');

      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toBe('tree command requires sandbox environment');
      }
      if (result.results[1]?.status === 'error') {
        expect(result.results[1].error_message).toBe('tree command requires sandbox environment');
      }
    });

    it('should handle empty paths without sandbox', async () => {
      const runtimeContext = new RuntimeContext();
      // Don't set sandbox in runtime context

      const result = await listFiles.execute({
        context: {
          paths: [],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(0);
    });
  });
});
