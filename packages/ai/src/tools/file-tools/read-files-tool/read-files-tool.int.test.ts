import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { readFiles } from './read-files-tool';

describe('read-files-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;

  beforeAll(async () => {
    if (!hasApiKey) return;

    // Create a sandbox for the tests
    sandbox = await createSandbox({
      language: 'typescript',
    });
  }, 30000); // 30 second timeout for sandbox creation

  afterAll(async () => {
    // Clean up the sandbox
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should read files in sandbox environment', async () => {
    // First, create test files in the sandbox
    const createFilesCode = `
      const fs = require('fs');
      
      fs.writeFileSync('test1.txt', 'Hello from test1');
      fs.writeFileSync('test2.txt', 'Hello from test2');
      console.log('Files created');
      console.log('Current directory:', process.cwd());
      console.log('Files in directory:', fs.readdirSync('.'));
    `;

    await sandbox.process.codeRun(createFilesCode);

    // Now test reading files with the tool
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await readFiles.execute({
      context: {
        files: ['test1.txt', 'test2.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toEqual({
      status: 'success',
      file_path: 'test1.txt',
      content: 'Hello from test1',
      truncated: false,
    });
    expect(result.results[1]).toEqual({
      status: 'success',
      file_path: 'test2.txt',
      content: 'Hello from test2',
      truncated: false,
    });
  });

  it.skipIf(!hasApiKey)('should handle non-existent files in sandbox', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await readFiles.execute({
      context: {
        files: ['nonexistent.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'error',
      file_path: 'nonexistent.txt',
      error_message: 'File not found',
    });
  });

  it.skipIf(!hasApiKey)('should handle concurrent file reads in sandbox', async () => {
    // Create multiple test files
    const createFilesCode = `
      const fs = require('fs');
      
      for (let i = 1; i <= 5; i++) {
        fs.writeFileSync(\`file\${i}.txt\`, \`Content of file \${i}\`);
      }
      console.log('Multiple files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await readFiles.execute({
      context: {
        files: ['file1.txt', 'file2.txt', 'file3.txt', 'file4.txt', 'file5.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(5);
    result.results.forEach((fileResult, index) => {
      expect(fileResult).toEqual({
        status: 'success',
        file_path: `file${index + 1}.txt`,
        content: `Content of file ${index + 1}`,
        truncated: false,
      });
    });
  });

  it('should fall back to local execution when no sandbox is available', async () => {
    // Create runtime context without sandbox
    const runtimeContext = new RuntimeContext();

    // This will use local file system
    const result = await readFiles.execute({
      context: {
        files: ['nonexistent-local.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'error',
      file_path: 'nonexistent-local.txt',
      error_message: 'File not found',
    });
  });
});
