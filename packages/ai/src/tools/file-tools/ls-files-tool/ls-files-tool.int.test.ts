import { createSandbox } from '@buster/sandbox';
import { addFiles } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { lsFiles } from './ls-files-tool';

// Define entry type based on the tool's output schema
type LsEntry = {
  name: string;
  type: 'file' | 'directory' | 'symlink' | 'other';
  size?: string | undefined;
  permissions?: string | undefined;
  modified?: string | undefined;
  owner?: string | undefined;
  group?: string | undefined;
};

describe('ls-files-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;

  async function createTestSandbox() {
    return await createSandbox({
      language: 'typescript',
    });
  }

  describe('with sandbox', () => {
    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should list files in current directory',
      async () => {
        const sandbox = await createTestSandbox();
        try {
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
            {
              path: 'subdir2/another.txt',
              content: 'Another file',
              destination: 'subdir2/another.txt',
            },
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

          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['.'],
            },
            runtimeContext,
          });

          expect(result.results).toHaveLength(1);
          expect(result.results[0]?.status).toBe('success');

          if (result.results[0]?.status === 'success') {
            const entries = result.results[0].entries;
            expect(entries.some((e: LsEntry) => e.name === 'file1.txt' && e.type === 'file')).toBe(
              true
            );
            expect(entries.some((e: LsEntry) => e.name === 'file2.txt' && e.type === 'file')).toBe(
              true
            );
            expect(
              entries.some((e: LsEntry) => e.name === 'subdir1' && e.type === 'directory')
            ).toBe(true);
            expect(
              entries.some((e: LsEntry) => e.name === 'subdir2' && e.type === 'directory')
            ).toBe(true);
            expect(entries.some((e: LsEntry) => e.name === '.hidden')).toBe(false); // Hidden by default
          }
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should list files with detailed information',
      async () => {
        const sandbox = await createTestSandbox();
        try {
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
            {
              path: 'subdir2/another.txt',
              content: 'Another file',
              destination: 'subdir2/another.txt',
            },
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

          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['.'],
              options: {
                detailed: true,
              },
            },
            runtimeContext,
          });

          expect(result.results[0]?.status).toBe('success');

          if (result.results[0]?.status === 'success') {
            const entries = result.results[0].entries;
            const file1 = entries.find((e: LsEntry) => e.name === 'file1.txt');
            expect(file1).toBeDefined();
            expect(file1?.permissions).toBeDefined();
            expect(file1?.size).toBeDefined();
            expect(file1?.modified).toBeDefined();
            expect(file1?.owner).toBeDefined();
            expect(file1?.group).toBeDefined();
          }
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should show hidden files with all option',
      async () => {
        const sandbox = await createTestSandbox();
        try {
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
            {
              path: 'subdir2/another.txt',
              content: 'Another file',
              destination: 'subdir2/another.txt',
            },
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

          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['.'],
              options: {
                all: true,
              },
            },
            runtimeContext,
          });

          expect(result.results[0]?.status).toBe('success');

          if (result.results[0]?.status === 'success') {
            const entries = result.results[0].entries;
            expect(entries.some((e: LsEntry) => e.name === '.hidden')).toBe(true);
            expect(entries.some((e: LsEntry) => e.name === '.')).toBe(true);
            expect(entries.some((e: LsEntry) => e.name === '..')).toBe(true);
          }
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should handle multiple paths',
      async () => {
        const sandbox = await createTestSandbox();
        try {
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
            {
              path: 'subdir2/another.txt',
              content: 'Another file',
              destination: 'subdir2/another.txt',
            },
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

          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['subdir1', 'subdir2'],
            },
            runtimeContext,
          });

          expect(result.results).toHaveLength(2);

          // Check subdir1
          expect(result.results[0]?.status).toBe('success');
          if (result.results[0]?.status === 'success') {
            const entries = result.results[0].entries;
            expect(entries.some((e) => e.name === 'nested1.txt')).toBe(true);
            expect(entries.some((e) => e.name === 'nested2.txt')).toBe(true);
          }

          // Check subdir2
          expect(result.results[1]?.status).toBe('success');
          if (result.results[1]?.status === 'success') {
            const entries = result.results[1].entries;
            expect(entries.some((e) => e.name === 'another.txt')).toBe(true);
          }
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should handle non-existent paths',
      async () => {
        const sandbox = await createTestSandbox();
        try {
          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['nonexistent-dir', 'also-nonexistent'],
            },
            runtimeContext,
          });

          expect(result.results).toHaveLength(2);
          expect(result.results[0]?.status).toBe('error');
          expect(result.results[1]?.status).toBe('error');

          if (result.results[0]?.status === 'error') {
            expect(result.results[0].error_message).toBe('Path not found');
          }
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should handle mixed success and failure',
      async () => {
        const sandbox = await createTestSandbox();
        try {
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
            {
              path: 'subdir2/another.txt',
              content: 'Another file',
              destination: 'subdir2/another.txt',
            },
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

          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['subdir1', 'nonexistent', '.'],
            },
            runtimeContext,
          });

          expect(result.results).toHaveLength(3);
          expect(result.results[0]?.status).toBe('success'); // subdir1 exists
          expect(result.results[1]?.status).toBe('error'); // nonexistent
          expect(result.results[2]?.status).toBe('success'); // current dir exists
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should handle all options combined',
      async () => {
        const sandbox = await createTestSandbox();
        try {
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
            {
              path: 'subdir2/another.txt',
              content: 'Another file',
              destination: 'subdir2/another.txt',
            },
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

          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: ['.'],
              options: {
                detailed: true,
                all: true,
                recursive: true,
                humanReadable: true,
              },
            },
            runtimeContext,
          });

          expect(result.results[0]?.status).toBe('success');

          if (result.results[0]?.status === 'success') {
            const entries = result.results[0].entries;
            expect(entries.some((e: LsEntry) => e.name === '.')).toBe(true); // -a shows hidden
            expect(entries[0]?.permissions).toBeDefined(); // -l shows details
          }
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );

    (hasApiKey ? it.concurrent : it.concurrent.skip)(
      'should handle empty paths array',
      async () => {
        const sandbox = await createTestSandbox();
        try {
          const runtimeContext = new RuntimeContext();
          runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

          const result = await lsFiles.execute({
            context: {
              paths: [],
            },
            runtimeContext,
          });

          expect(result.results).toHaveLength(0);
        } finally {
          await sandbox.delete();
        }
      },
      65000
    );
  });

  describe('without sandbox', () => {
    it('should return error when sandbox is not available', async () => {
      const runtimeContext = new RuntimeContext();
      // Don't set sandbox in runtime context

      const result = await lsFiles.execute({
        context: {
          paths: ['.', '/some/path'],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.status).toBe('error');
      expect(result.results[1]?.status).toBe('error');

      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toBe('ls command requires sandbox environment');
      }
      if (result.results[1]?.status === 'error') {
        expect(result.results[1].error_message).toBe('ls command requires sandbox environment');
      }
    });

    it('should handle empty paths without sandbox', async () => {
      const runtimeContext = new RuntimeContext();
      // Don't set sandbox in runtime context

      const result = await lsFiles.execute({
        context: {
          paths: [],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(0);
    });
  });
});
