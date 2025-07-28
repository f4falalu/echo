import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { deleteFiles } from './delete-files-tool';

describe('delete-files-tool integration test', () => {
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

  it.skipIf(!hasApiKey)('should delete files in sandbox environment', async () => {
    // First, create test files
    const createFilesCode = `
      const fs = require('fs');
      
      fs.writeFileSync('delete1.txt', 'File to delete 1');
      fs.writeFileSync('delete2.txt', 'File to delete 2');
      fs.mkdirSync('subdir', { recursive: true });
      fs.writeFileSync('subdir/delete3.txt', 'File to delete 3');
      
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    // Now test deleting files with the tool
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await deleteFiles.execute({
      context: {
        files: [{ path: 'delete1.txt' }, { path: 'delete2.txt' }, { path: 'subdir/delete3.txt' }],
      },
      runtimeContext,
    });

    expect(result.successes).toHaveLength(3);
    expect(result.successes).toContain('delete1.txt');
    expect(result.successes).toContain('delete2.txt');
    expect(result.successes).toContain('subdir/delete3.txt');
    expect(result.failures).toHaveLength(0);

    // Verify files were actually deleted
    const verifyCode = `
      const fs = require('fs');
      const files = ['delete1.txt', 'delete2.txt', 'subdir/delete3.txt'];
      const results = {};
      for (const file of files) {
        results[file] = fs.existsSync(file);
      }
      console.log(JSON.stringify(results));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const fileExists = JSON.parse(verifyResult.result);

    expect(fileExists['delete1.txt']).toBe(false);
    expect(fileExists['delete2.txt']).toBe(false);
    expect(fileExists['subdir/delete3.txt']).toBe(false);
  });

  it.skipIf(!hasApiKey)('should handle non-existent files gracefully', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await deleteFiles.execute({
      context: {
        files: [{ path: 'nonexistent1.txt' }, { path: 'nonexistent2.txt' }],
      },
      runtimeContext,
    });

    expect(result.successes).toHaveLength(0);
    expect(result.failures).toHaveLength(2);
    expect(result.failures[0]).toEqual({
      path: 'nonexistent1.txt',
      error: 'File not found',
    });
    expect(result.failures[1]).toEqual({
      path: 'nonexistent2.txt',
      error: 'File not found',
    });
  });

  it.skipIf(!hasApiKey)('should handle mixed success and failure', async () => {
    // Create some files but not all
    const createFilesCode = `
      const fs = require('fs');
      fs.writeFileSync('exists1.txt', 'This file exists');
      fs.writeFileSync('exists2.txt', 'This file also exists');
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await deleteFiles.execute({
      context: {
        files: [{ path: 'exists1.txt' }, { path: 'does-not-exist.txt' }, { path: 'exists2.txt' }],
      },
      runtimeContext,
    });

    expect(result.successes).toHaveLength(2);
    expect(result.successes).toContain('exists1.txt');
    expect(result.successes).toContain('exists2.txt');
    expect(result.failures).toHaveLength(1);
    expect(result.failures[0]).toEqual({
      path: 'does-not-exist.txt',
      error: 'File not found',
    });
  });

  it.skipIf(!hasApiKey)('should handle absolute paths', async () => {
    // Create a file with absolute path
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('/tmp/absolute-delete-test.txt', 'Absolute path file');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await deleteFiles.execute({
      context: {
        files: [{ path: '/tmp/absolute-delete-test.txt' }],
      },
      runtimeContext,
    });

    expect(result.successes).toHaveLength(1);
    expect(result.successes).toContain('/tmp/absolute-delete-test.txt');
    expect(result.failures).toHaveLength(0);

    // Verify file was deleted
    const verifyCode = `
      const fs = require('fs');
      const exists = fs.existsSync('/tmp/absolute-delete-test.txt');
      console.log(JSON.stringify(exists));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    expect(JSON.parse(verifyResult.result)).toBe(false);
  });

  it.skipIf(!hasApiKey)('should handle permission errors gracefully', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    // Try to delete a system file (should fail with permission error)
    const result = await deleteFiles.execute({
      context: {
        files: [
          { path: '/etc/passwd' }, // System file, should not be deletable
          { path: 'regular-file.txt' }, // Non-existent file
        ],
      },
      runtimeContext,
    });

    expect(result.successes).toHaveLength(0);
    expect(result.failures).toHaveLength(2);
    // Both should fail, but for different reasons
    expect(result.failures.some((f) => f.path === '/etc/passwd')).toBe(true);
    expect(result.failures.some((f) => f.path === 'regular-file.txt')).toBe(true);
  });
});
