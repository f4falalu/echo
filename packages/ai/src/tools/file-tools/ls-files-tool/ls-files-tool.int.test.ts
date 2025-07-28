import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { lsFiles } from './ls-files-tool';

describe('ls-files-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;

  beforeAll(async () => {
    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });
  }, 60000); // 60 second timeout for sandbox creation

  afterAll(async () => {
    // Clean up the sandbox
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should list files in sandbox environment', async () => {
    // First, create test files and directories
    const createFilesCode = `
      const fs = require('fs');
      
      // Create files in root
      fs.writeFileSync('file1.txt', 'Content 1');
      fs.writeFileSync('file2.txt', 'Content 2');
      fs.writeFileSync('.hidden', 'Hidden file');
      
      // Create directories with files
      fs.mkdirSync('subdir1', { recursive: true });
      fs.writeFileSync('subdir1/nested1.txt', 'Nested content 1');
      fs.writeFileSync('subdir1/nested2.txt', 'Nested content 2');
      
      fs.mkdirSync('subdir2', { recursive: true });
      fs.writeFileSync('subdir2/another.txt', 'Another file');
      
      console.log('Files and directories created');
    `;

    await sandbox.process.codeRun(createFilesCode);

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

      // Should contain files and directories (but not hidden by default)
      expect(entries.some((e) => e.name === 'file1.txt' && e.type === 'file')).toBe(true);
      expect(entries.some((e) => e.name === 'file2.txt' && e.type === 'file')).toBe(true);
      expect(entries.some((e) => e.name === 'subdir1' && e.type === 'directory')).toBe(true);
      expect(entries.some((e) => e.name === 'subdir2' && e.type === 'directory')).toBe(true);
      expect(entries.some((e) => e.name === '.hidden')).toBe(false); // Hidden by default
    }
  });

  it.skipIf(!hasApiKey)('should list files with detailed information', async () => {
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

      // Check that detailed info is present
      const file1 = entries.find((e) => e.name === 'file1.txt');
      expect(file1).toBeDefined();
      expect(file1?.permissions).toBeDefined();
      expect(file1?.size).toBeDefined();
      expect(file1?.modified).toBeDefined();
      expect(file1?.owner).toBeDefined();
      expect(file1?.group).toBeDefined();
    }
  });

  it.skipIf(!hasApiKey)('should show hidden files with all option', async () => {
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

      // Should now include hidden files
      expect(entries.some((e) => e.name === '.hidden')).toBe(true);
      expect(entries.some((e) => e.name === '.')).toBe(true);
      expect(entries.some((e) => e.name === '..')).toBe(true);
    }
  });

  it.skipIf(!hasApiKey)('should list multiple paths', async () => {
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
  });

  it.skipIf(!hasApiKey)('should handle non-existent paths', async () => {
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
  });

  it.skipIf(!hasApiKey)('should handle mixed success and failure', async () => {
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
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    // Create a file in /tmp
    const createTmpFileCode = `
      const fs = require('fs');
      fs.mkdirSync('/tmp/test-ls', { recursive: true });
      fs.writeFileSync('/tmp/test-ls/tmpfile.txt', 'Temp file');
      console.log('Temp file created');
    `;

    await sandbox.process.codeRun(createTmpFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await lsFiles.execute({
      context: {
        paths: ['/tmp/test-ls'],
      },
      runtimeContext,
    });

    expect(result.results[0]?.status).toBe('success');
    if (result.results[0]?.status === 'success') {
      const entries = result.results[0].entries;
      expect(entries.some((e) => e.name === 'tmpfile.txt')).toBe(true);
    }
  });
});
