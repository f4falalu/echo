import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { grepSearch } from './grep-search-tool';

describe('grep-search-tool integration test', () => {
  const hasApiKey = !!process.env.DAYTONA_API_KEY;
  let sandbox: Sandbox;

  // Helper function to create a search config with defaults
  const createSearchConfig = (config: {
    path: string;
    pattern: string;
    recursive?: boolean;
    ignoreCase?: boolean;
    invertMatch?: boolean;
    lineNumbers?: boolean;
    wordMatch?: boolean;
    fixedStrings?: boolean;
    maxCount?: number;
  }) => ({
    path: config.path,
    pattern: config.pattern,
    recursive: config.recursive ?? false,
    ignoreCase: config.ignoreCase ?? false,
    invertMatch: config.invertMatch ?? false,
    lineNumbers: config.lineNumbers ?? true,
    wordMatch: config.wordMatch ?? false,
    fixedStrings: config.fixedStrings ?? false,
    ...(config.maxCount !== undefined && { maxCount: config.maxCount }),
  });

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

  it.skipIf(!hasApiKey)('should perform grep searches in sandbox environment', async () => {
    // First, create test files with searchable content
    const createFilesCode = `
      const fs = require('fs');
      
      fs.writeFileSync('test1.txt', 'Hello world\\nThis is a test file\\nGoodbye world');
      fs.writeFileSync('test2.txt', 'Another test file\\nHello again\\nMore content here');
      fs.mkdirSync('subdir', { recursive: true });
      fs.writeFileSync('subdir/test3.txt', 'Nested file\\nHello from subdirectory\\nEnd of file');
      
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'test1.txt',
            pattern: 'test',
            recursive: false,
            ignoreCase: false,
            invertMatch: false,
            lineNumbers: true,
            wordMatch: false,
            fixedStrings: false,
          },
          {
            path: '.',
            pattern: 'Hello',
            recursive: true,
            ignoreCase: false,
            invertMatch: false,
            lineNumbers: true,
            wordMatch: false,
            fixedStrings: false,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(2);
    expect(result.failed_searches).toHaveLength(0);

    // Check first search results
    const firstSearch = result.successful_searches[0];
    expect(firstSearch?.path).toBe('test1.txt');
    expect(firstSearch?.pattern).toBe('test');
    expect(firstSearch?.matchCount).toBe(1);
    expect(firstSearch?.matches[0]).toMatchObject({
      file: 'test1.txt',
      lineNumber: 2,
      content: 'This is a test file',
    });

    // Check second search results (recursive)
    const secondSearch = result.successful_searches[1];
    expect(secondSearch?.path).toBe('.');
    expect(secondSearch?.pattern).toBe('Hello');
    expect(secondSearch?.matchCount).toBeGreaterThan(0);
    expect(secondSearch?.matches.some((m) => m.file.includes('test1.txt'))).toBe(true);
    expect(secondSearch?.matches.some((m) => m.file.includes('test2.txt'))).toBe(true);
    expect(secondSearch?.matches.some((m) => m.file.includes('subdir/test3.txt'))).toBe(true);
  });

  it.skipIf(!hasApiKey)('should handle case-insensitive searches', async () => {
    // Create a test file with mixed case content
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('case-test.txt', 'HELLO World\\nhello world\\nHeLLo WoRLd');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'case-test.txt',
            pattern: 'hello',
            recursive: false,
            ignoreCase: true,
            invertMatch: false,
            lineNumbers: true,
            wordMatch: false,
            fixedStrings: false,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(1);
    const search = result.successful_searches[0];
    expect(search?.matchCount).toBe(3); // Should match all three lines
    expect(search?.matches.map((m) => m.lineNumber)).toEqual([1, 2, 3]);
  });

  it.skipIf(!hasApiKey)('should handle whole word matches', async () => {
    // Create a test file
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('word-test.txt', 'test testing\\ntested tester\\ntest');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          createSearchConfig({
            path: 'word-test.txt',
            pattern: 'test',
            wordMatch: true,
          }),
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(1);
    const search = result.successful_searches[0];
    expect(search?.matchCount).toBe(2); // Should only match "test" as whole word
    expect(search?.matches[0]?.content).toBe('test testing');
    expect(search?.matches[1]?.content).toBe('test');
  });

  it.skipIf(!hasApiKey)('should handle fixed string searches (literal)', async () => {
    // Create a test file with regex special characters
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('regex-test.txt', 'Price: $10.99\\nPattern: test.*\\nArray: [1,2,3]');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'regex-test.txt',
            pattern: '$10.99',
            fixedStrings: true,
          },
          {
            path: 'regex-test.txt',
            pattern: 'test.*',
            fixedStrings: true,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(2);
    expect(result.successful_searches[0]?.matchCount).toBe(1);
    expect(result.successful_searches[1]?.matchCount).toBe(1);
  });

  it.skipIf(!hasApiKey)('should handle inverted matches', async () => {
    // Create a test file
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('invert-test.txt', 'Line with test\\nLine without\\nAnother test line\\nNo match here');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'invert-test.txt',
            pattern: 'test',
            invertMatch: true,
            lineNumbers: true,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(1);
    const search = result.successful_searches[0];
    expect(search?.matchCount).toBe(2); // Lines without "test"
    expect(search?.matches[0]?.content).toBe('Line without');
    expect(search?.matches[1]?.content).toBe('No match here');
  });

  it.skipIf(!hasApiKey)('should handle max count limit', async () => {
    // Create a test file with many matches
    const createFileCode = `
      const fs = require('fs');
      const content = Array(10).fill('match line').join('\\n');
      fs.writeFileSync('maxcount-test.txt', content);
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'maxcount-test.txt',
            pattern: 'match',
            maxCount: 3,
            lineNumbers: true,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(1);
    const search = result.successful_searches[0];
    expect(search?.matchCount).toBe(3); // Limited by maxCount
  });

  it.skipIf(!hasApiKey)('should handle path not found errors', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        searches: [
          {
            path: 'nonexistent.txt',
            pattern: 'test',
          },
          {
            path: 'nonexistent-dir',
            pattern: 'test',
            recursive: true,
          },
        ],
      },
      runtimeContext,
    });

    expect(result.successful_searches).toHaveLength(0);
    expect(result.failed_searches).toHaveLength(2);
    expect(result.failed_searches[0]?.error).toContain('Path does not exist');
    expect(result.failed_searches[1]?.error).toContain('Path does not exist');
  });
});
