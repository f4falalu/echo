import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { grepSearch } from './grep-search-tool';

describe('grep-search-tool integration test', () => {
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

  it.skipIf(!hasApiKey)('should execute ripgrep commands in sandbox environment', async () => {
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
        commands: [
          {
            command: 'rg -n "test" test1.txt',
          },
          {
            command: 'rg -n "Hello"',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(2);

    // Check first command results
    const firstResult = result.results[0];
    expect(firstResult?.success).toBe(true);
    expect(firstResult?.command).toBe('rg -n "test" test1.txt');
    expect(firstResult?.stdout).toContain('2:This is a test file');

    // Check second command results (searches all files)
    const secondResult = result.results[1];
    expect(secondResult?.success).toBe(true);
    expect(secondResult?.command).toBe('rg -n "Hello"');
    expect(secondResult?.stdout).toContain('test1.txt:1:Hello world');
    expect(secondResult?.stdout).toContain('test2.txt:2:Hello again');
    expect(secondResult?.stdout).toContain('subdir/test3.txt:2:Hello from subdirectory');
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
        commands: [
          {
            command: 'rg -i -n "hello" case-test.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);
    expect(search?.stdout).toContain('1:HELLO World');
    expect(search?.stdout).toContain('2:hello world');
    expect(search?.stdout).toContain('3:HeLLo WoRLd');
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
        commands: [
          {
            command: 'rg -w -n "test" word-test.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);
    expect(search?.stdout).toContain('1:test testing');
    expect(search?.stdout).toContain('3:test');
    expect(search?.stdout).not.toContain('tester'); // Should not match partial words
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
        commands: [
          {
            command: 'rg -F -n "$10.99" regex-test.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);
    expect(search?.stdout).toContain('1:Price: $10.99');
  });

  it.skipIf(!hasApiKey)('should handle inverted matches', async () => {
    // Create a test file
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('invert-test.txt', 'line with test\\nline without\\nanother test line\\nno match here');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg -v -n "test" invert-test.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);
    expect(search?.stdout).toContain('2:line without');
    expect(search?.stdout).toContain('4:no match here');
  });

  it.skipIf(!hasApiKey)('should handle max count option', async () => {
    // Create a test file with multiple matches
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('many-matches.txt', 'test 1\\ntest 2\\ntest 3\\ntest 4\\ntest 5');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg -m 3 -n "test" many-matches.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);
    const lines = search?.stdout?.trim().split('\n') || [];
    expect(lines).toHaveLength(3); // Should only return 3 matches
  });

  it.skipIf(!hasApiKey)('should handle no matches found', async () => {
    // Create a test file with no matching content
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('no-match.txt', 'This file has no matches\\nNothing to find here');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg -n "nonexistent" no-match.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true); // Exit code 1 is treated as success for rg
    expect(search?.stdout).toBe('');
  });

  it.skipIf(!hasApiKey)('should handle multiple commands', async () => {
    // Create test files
    const createFilesCode = `
      const fs = require('fs');
      fs.writeFileSync('file1.txt', 'First file with test');
      fs.writeFileSync('file2.txt', 'Second file with test');
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg -n "test" file1.txt',
          },
          {
            command: 'rg -n "test" file2.txt',
          },
          {
            command: 'rg -n "nonexistent" file1.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(3);
    expect(result.results[0]?.stdout).toContain('First file with test');
    expect(result.results[1]?.stdout).toContain('Second file with test');
    expect(result.results[2]?.stdout).toBe(''); // No match
  });

  it.skipIf(!hasApiKey)('should handle file not found error', async () => {
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg "test" /nonexistent/path/file.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(false);
    expect(search?.error).toBeDefined();
    expect(search?.stderr).toBeDefined();
  });

  it.skipIf(!hasApiKey)('should handle complex rg commands with multiple flags', async () => {
    // Create test files
    const createFilesCode = `
      const fs = require('fs');
      fs.mkdirSync('src', { recursive: true });
      fs.writeFileSync('src/main.ts', 'TODO: implement feature\\nconsole.log("test");');
      fs.writeFileSync('src/utils.ts', 'TODO: fix bug\\nexport function test() {}');
      fs.writeFileSync('src/readme.md', 'TODO: update docs');
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg --type ts --color never -n "TODO" src/',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);
    expect(search?.stdout).toContain('src/main.ts:1:TODO: implement feature');
    expect(search?.stdout).toContain('src/utils.ts:1:TODO: fix bug');
    expect(search?.stdout).not.toContain('readme.md'); // Should not match .md files
  });

  it.skipIf(!hasApiKey)('should handle JSON output from rg', async () => {
    // Create a test file
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('json-test.txt', 'Line with test\\nAnother line');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await grepSearch.execute({
      context: {
        commands: [
          {
            command: 'rg --json "test" json-test.txt',
          },
        ],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    const search = result.results[0];
    expect(search?.success).toBe(true);

    // Parse JSON output
    const jsonLines = search?.stdout?.trim().split('\n') || [];
    expect(jsonLines.length).toBeGreaterThan(0);

    const firstLine = JSON.parse(jsonLines[0] || '{}');
    expect(firstLine.type).toBe('begin');

    // Find the match line
    const matchLine = jsonLines.find((line) => {
      const parsed = JSON.parse(line);
      return parsed.type === 'match';
    });
    expect(matchLine).toBeDefined();
  });
});
