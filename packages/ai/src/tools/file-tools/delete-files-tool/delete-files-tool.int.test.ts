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
        paths: ['delete1.txt', 'delete2.txt', 'subdir/delete3.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(3);
    expect(result.results).toEqual([
      {
        status: 'success',
        path: 'delete1.txt',
      },
      {
        status: 'success',
        path: 'delete2.txt',
      },
      {
        status: 'success',
        path: 'subdir/delete3.txt',
      },
    ]);

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
        paths: ['nonexistent1.txt', 'nonexistent2.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);
    expect(result.results).toEqual([
      {
        status: 'error',
        path: 'nonexistent1.txt',
        error_message: 'File not found',
      },
      {
        status: 'error',
        path: 'nonexistent2.txt',
        error_message: 'File not found',
      },
    ]);
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
        paths: ['exists1.txt', 'does-not-exist.txt', 'exists2.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(3);
    expect(result.results).toEqual([
      {
        status: 'success',
        path: 'exists1.txt',
      },
      {
        status: 'error',
        path: 'does-not-exist.txt',
        error_message: 'File not found',
      },
      {
        status: 'success',
        path: 'exists2.txt',
      },
    ]);
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
        paths: ['/tmp/absolute-delete-test.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results).toEqual([
      {
        status: 'success',
        path: '/tmp/absolute-delete-test.txt',
      },
    ]);

    // Verify file was deleted
    const verifyCode = `
      const fs = require('fs');
      const exists = fs.existsSync('/tmp/absolute-delete-test.txt');
      console.log(JSON.stringify(exists));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    expect(JSON.parse(verifyResult.result)).toBe(false);
  });

  it.skipIf(!hasApiKey)('should prevent deletion of directories', async () => {
    // Create a directory
    const createDirCode = `
      const fs = require('fs');
      fs.mkdirSync('test-directory', { recursive: true });
      console.log('Directory created');
    `;

    await sandbox.process.codeRun(createDirCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await deleteFiles.execute({
      context: {
        paths: ['test-directory'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results).toEqual([
      {
        status: 'error',
        path: 'test-directory',
        error_message: 'Cannot delete directories with this tool',
      },
    ]);

    // Verify directory still exists
    const verifyCode = `
      const fs = require('fs');
      const exists = fs.existsSync('test-directory');
      const isDir = exists && fs.statSync('test-directory').isDirectory();
      console.log(JSON.stringify({ exists, isDir }));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const status = JSON.parse(verifyResult.result);
    expect(status.exists).toBe(true);
    expect(status.isDir).toBe(true);
  });

  it.skipIf(!hasApiKey)('should handle permission errors gracefully', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    // Try to delete a system file (should fail with permission error)
    const result = await deleteFiles.execute({
      context: {
        paths: [
          '/etc/passwd', // System file, should not be deletable
          'regular-file.txt', // Non-existent file
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);

    // Both should fail, but for different reasons
    const passwdResult = result.results.find((r) => r.path === '/etc/passwd');
    expect(passwdResult?.status).toBe('error');
    expect(passwdResult?.error_message).toBeDefined();

    const regularFileResult = result.results.find((r) => r.path === 'regular-file.txt');
    expect(regularFileResult?.status).toBe('error');
    expect(regularFileResult?.error_message).toBe('File not found');
  });

  it.skipIf(!hasApiKey)('should handle files with spaces in names', async () => {
    // Create a file with spaces in the name
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('file with spaces.txt', 'Content with spaces');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await deleteFiles.execute({
      context: {
        paths: ['file with spaces.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results).toEqual([
      {
        status: 'success',
        path: 'file with spaces.txt',
      },
    ]);

    // Verify file was deleted
    const verifyCode = `
      const fs = require('fs');
      const exists = fs.existsSync('file with spaces.txt');
      console.log(JSON.stringify(exists));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    expect(JSON.parse(verifyResult.result)).toBe(false);
  });
});
