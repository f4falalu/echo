import { createSandbox } from '@buster/sandbox';
import type { Sandbox } from '@daytonaio/sdk';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SandboxContextKey } from '../../../context/sandbox-context';
import { grepSearch } from './grep-search-tool';

describe('grep-search-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;

  beforeAll(async () => {
    if (!hasApiKey) return;

    sandbox = await createSandbox({
      language: 'typescript',
    });
  }, 30000);

  afterAll(async () => {
    if (sandbox) {
      await sandbox.delete();
    }
  });

  it.skipIf(!hasApiKey)('should perform grep searches in sandbox environment', async () => {
    const createFilesCode = `
      const fs = require('fs');
      
      fs.writeFileSync('test1.txt', 'Hello world\\nThis is a test\\nAnother line');
      fs.writeFileSync('test2.txt', 'Different content\\nHello again\\nFinal line');
      console.log('Files created');
      console.log('Current directory:', process.cwd());
      console.log('Files in directory:', fs.readdirSync('.'));
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(SandboxContextKey.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'test1.txt',
            pattern: 'test',
            lineNumbers: true,
          },
          {
            path: 'test2.txt',
            pattern: 'Hello',
            lineNumbers: true,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(2);
    expect(result.successful_searches[0]).toEqual({
      path: 'test1.txt',
      pattern: 'test',
      matches: [
        {
          file: 'test1.txt',
          lineNumber: 2,
          content: 'This is a test',
        },
      ],
      matchCount: 1,
    });
    expect(result.successful_searches[1]).toEqual({
      path: 'test2.txt',
      pattern: 'Hello',
      matches: [
        {
          file: 'test2.txt',
          lineNumber: 2,
          content: 'Hello again',
        },
      ],
      matchCount: 1,
    });
  });

  it.skipIf(!hasApiKey)('should handle non-existent files in sandbox', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(SandboxContextKey.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'nonexistent.txt',
            pattern: 'test',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.failed_searches).toHaveLength(1);
    expect(result.failed_searches[0]).toEqual({
      path: 'nonexistent.txt',
      pattern: 'test',
      error: 'Path does not exist: nonexistent.txt',
    });
  });

  it.skipIf(!hasApiKey)('should handle case-insensitive searches in sandbox', async () => {
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('case-test.txt', 'Hello World\\nHELLO world\\nhello WORLD');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(SandboxContextKey.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'case-test.txt',
            pattern: 'hello',
            ignoreCase: true,
            lineNumbers: true,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches[0].matchCount).toBe(3);
  });

  it('should fall back to local execution when no sandbox is available', async () => {
    const runtimeContext = new RuntimeContext();

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'nonexistent-local.txt',
            pattern: 'test',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.failed_searches).toHaveLength(1);
    expect(result.failed_searches[0]).toEqual({
      path: 'nonexistent-local.txt',
      pattern: 'test',
      error: 'Path does not exist: nonexistent-local.txt',
    });
  });
});
