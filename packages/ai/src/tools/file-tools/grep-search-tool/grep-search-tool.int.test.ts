import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { grepSearch } from './grep-search-tool';

describe.sequential('grep-search-tool integration test', () => {
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

  (hasApiKey ? it : it.skip)(
    'should execute ripgrep commands in sandbox environment',
    async () => {
      const testDir = getTestDir();

      // First, create test files with searchable content
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('test1.txt', 'Hello world\\nThis is a test file\\nGoodbye world');
        fs.writeFileSync('test2.txt', 'Another test file\\nHello again\\nMore content here');
        fs.mkdirSync('subdir', { recursive: true });
        fs.writeFileSync('subdir/test3.txt', 'Nested file\\nHello from subdirectory\\nEnd of file');
        
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -n "test" test1.txt`,
            },
            {
              command: `cd ${testDir} && rg -n "Hello"`,
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);

      // Check first command results
      const firstResult = result.results[0];
      expect(firstResult?.success).toBe(true);
      expect(firstResult?.command).toBe(`cd ${testDir} && rg -n "test" test1.txt`);
      expect(firstResult?.stdout).toContain('2:This is a test file');

      // Check second command results (searches all files)
      const secondResult = result.results[1];
      expect(secondResult?.success).toBe(true);
      expect(secondResult?.command).toBe(`cd ${testDir} && rg -n "Hello"`);
      expect(secondResult?.stdout).toContain('test1.txt:1:Hello world');
      expect(secondResult?.stdout).toContain('test2.txt:2:Hello again');
      expect(secondResult?.stdout).toContain('subdir/test3.txt:2:Hello from subdirectory');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle case-insensitive searches',
    async () => {
      const testDir = getTestDir();

      // Create a test file with mixed case content
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('case-test.txt', 'HELLO World\\nhello world\\nHeLLo WoRLd');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -i -n "hello" case-test.txt`,
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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle whole word matches',
    async () => {
      const testDir = getTestDir();

      // Create a test file
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('word-test.txt', 'test testing\\ntested tester\\ntest');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -w -n "test" word-test.txt`,
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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle fixed string searches (literal)',
    async () => {
      const testDir = getTestDir();

      // Create a test file with regex special characters
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('regex-test.txt', 'Price: $10.99\\nPattern: test.*\\nArray: [1,2,3]');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -F -n "$10.99" regex-test.txt`,
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      const search = result.results[0];
      expect(search?.success).toBe(true);
      expect(search?.stdout).toContain('1:Price: $10.99');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle inverted matches',
    async () => {
      const testDir = getTestDir();

      // Create a test file
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('invert-test.txt', 'line with test\\nline without\\nanother test line\\nno match here');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -v -n "test" invert-test.txt`,
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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle max count option',
    async () => {
      const testDir = getTestDir();

      // Create a test file with multiple matches
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('many-matches.txt', 'test 1\\ntest 2\\ntest 3\\ntest 4\\ntest 5');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -m 3 -n "test" many-matches.txt`,
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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle no matches found',
    async () => {
      const testDir = getTestDir();

      // Create a test file with no matching content
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('no-match.txt', 'This file has no matches\\nNothing to find here');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -n "nonexistent" no-match.txt`,
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      const search = result.results[0];
      expect(search?.success).toBe(true); // Exit code 1 is treated as success for rg
      expect(search?.stdout).toBe('');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle multiple commands',
    async () => {
      const testDir = getTestDir();

      // Create test files
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('file1.txt', 'First file with test');
        fs.writeFileSync('file2.txt', 'Second file with test');
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg -n "test" file1.txt`,
            },
            {
              command: `cd ${testDir} && rg -n "test" file2.txt`,
            },
            {
              command: `cd ${testDir} && rg -n "nonexistent" file1.txt`,
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0]?.stdout).toContain('First file with test');
      expect(result.results[1]?.stdout).toContain('Second file with test');
      expect(result.results[2]?.stdout).toBe(''); // No match
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle file not found error',
    async () => {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle complex rg commands with multiple flags',
    async () => {
      const testDir = getTestDir();

      // Create test files
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.mkdirSync('src', { recursive: true });
        fs.writeFileSync('src/main.ts', 'TODO: implement feature\\nconsole.log("test");');
        fs.writeFileSync('src/utils.ts', 'TODO: fix bug\\nexport function test() {}');
        fs.writeFileSync('src/readme.md', 'TODO: update docs');
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg --type ts --color never -n "TODO" src/`,
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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle JSON output from rg',
    async () => {
      const testDir = getTestDir();

      // Create a test file
      const createFileCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('json-test.txt', 'Line with test\\nAnother line');
        console.log('File created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await grepSearch.execute({
        context: {
          commands: [
            {
              command: `cd ${testDir} && rg --json "test" json-test.txt`,
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
    },
    65000
  );
});
