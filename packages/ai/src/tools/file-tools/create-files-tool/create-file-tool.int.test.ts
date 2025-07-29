import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { createFiles } from './create-file-tool';

describe('create-file-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;

  async function createTestSandbox() {
    return await createSandbox({
      language: 'typescript',
    });
  }

  it.concurrent.skipIf(!hasApiKey)('should create files in sandbox environment', async () => {
    const sandbox = await createTestSandbox();
    try {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await createFiles.execute({
      context: {
        files: [
          { path: 'test1.txt', content: 'Hello from test1' },
          { path: 'test2.txt', content: 'Hello from test2' },
          { path: 'subdir/test3.txt', content: 'Hello from subdirectory' },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(3);
    expect(result.results[0]).toEqual({
      status: 'success',
      filePath: 'test1.txt',
    });
    expect(result.results[1]).toEqual({
      status: 'success',
      filePath: 'test2.txt',
    });
    expect(result.results[2]).toEqual({
      status: 'success',
      filePath: 'subdir/test3.txt',
    });

    // Verify files were actually created by reading them
    const verifyCode = `
      const fs = require('fs');
      const files = ['test1.txt', 'test2.txt', 'subdir/test3.txt'];
      const results = {};
      for (const file of files) {
        try {
          results[file] = fs.readFileSync(file, 'utf-8');
        } catch (error) {
          results[file] = 'ERROR: ' + error.message;
        }
      }
      console.log(JSON.stringify(results));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const fileContents = JSON.parse(verifyResult.result);

    expect(fileContents['test1.txt']).toBe('Hello from test1');
    expect(fileContents['test2.txt']).toBe('Hello from test2');
    expect(fileContents['subdir/test3.txt']).toBe('Hello from subdirectory');
    } finally {
      await sandbox.delete();
    }
  }, 65000);

  it.concurrent.skipIf(!hasApiKey)('should handle absolute paths in sandbox', async () => {
    const sandbox = await createTestSandbox();
    try {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await createFiles.execute({
      context: {
        files: [{ path: '/tmp/absolute-test.txt', content: 'Absolute path content' }],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'success',
      filePath: '/tmp/absolute-test.txt',
    });

    // Verify the file was created
    const verifyCode = `
      const fs = require('fs');
      try {
        const content = fs.readFileSync('/tmp/absolute-test.txt', 'utf-8');
        console.log(JSON.stringify({ success: true, content }));
      } catch (error) {
        console.log(JSON.stringify({ success: false, error: error.message }));
      }
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const verification = JSON.parse(verifyResult.result);
    expect(verification.success).toBe(true);
    expect(verification.content).toBe('Absolute path content');
    } finally {
      await sandbox.delete();
    }
  }, 65000);

  it.concurrent.skipIf(!hasApiKey)('should overwrite existing files', async () => {
    const sandbox = await createTestSandbox();
    try {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    // First create a file
    await createFiles.execute({
      context: {
        files: [{ path: 'overwrite-test.txt', content: 'Original content' }],
      },
      runtimeContext,
    });

    // Then overwrite it
    const result = await createFiles.execute({
      context: {
        files: [{ path: 'overwrite-test.txt', content: 'New content' }],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'success',
      filePath: 'overwrite-test.txt',
    });

    // Verify the content was overwritten
    const verifyCode = `
      const fs = require('fs');
      const content = fs.readFileSync('overwrite-test.txt', 'utf-8');
      console.log(JSON.stringify(content));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    expect(JSON.parse(verifyResult.result)).toBe('New content');
    } finally {
      await sandbox.delete();
    }
  }, 65000);

  it.concurrent.skipIf(!hasApiKey)('should handle special characters in content', async () => {
    const sandbox = await createTestSandbox();
    try {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const specialContent = 'Line 1\nLine 2\tTabbed\n"Quoted"\n\'Single quoted\'';

    const result = await createFiles.execute({
      context: {
        files: [{ path: 'special-chars.txt', content: specialContent }],
      },
      runtimeContext,
    });

    expect(result.results[0]).toEqual({
      status: 'success',
      filePath: 'special-chars.txt',
    });

    // Verify special characters were preserved
    const verifyCode = `
      const fs = require('fs');
      const content = fs.readFileSync('special-chars.txt', 'utf-8');
      console.log(JSON.stringify(content));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    expect(JSON.parse(verifyResult.result)).toBe(specialContent);
    } finally {
      await sandbox.delete();
    }
  }, 65000);

  it.concurrent.skipIf(!hasApiKey)('should handle permission errors gracefully', async () => {
    const sandbox = await createTestSandbox();
    try {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    // Try to create a file in a restricted directory
    const result = await createFiles.execute({
      context: {
        files: [
          { path: '/root/restricted.txt', content: 'This should fail' },
          { path: 'valid-file.txt', content: 'This should succeed' },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);
    // First file should fail
    expect(result.results[0]?.status).toBe('error');
    if (result.results[0]?.status === 'error') {
      expect(result.results[0].errorMessage).toBeTruthy();
    }
    // Second file should succeed
    expect(result.results[1]).toEqual({
      status: 'success',
      filePath: 'valid-file.txt',
    });
  });
});
