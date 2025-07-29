import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { readFiles } from './read-files-tool';

describe.sequential('read-files-tool integration test', () => {
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
    'should read files in sandbox environment',
    async () => {
      const testDir = getTestDir();

      // First, create test files in the sandbox
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('test1.txt', 'Hello from test1');
        fs.writeFileSync('test2.txt', 'Hello from test2');
        console.log('Files created in ' + process.cwd());
        console.log('Files in directory:', fs.readdirSync('.'));
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      // Now test reading files with the tool
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await readFiles.execute({
        context: {
          files: [`${testDir}/test1.txt`, `${testDir}/test2.txt`],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        status: 'success',
        file_path: `${testDir}/test1.txt`,
        content: 'Hello from test1',
        truncated: false,
      });
      expect(result.results[1]).toEqual({
        status: 'success',
        file_path: `${testDir}/test2.txt`,
        content: 'Hello from test2',
        truncated: false,
      });
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle non-existent files in sandbox',
    async () => {
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

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
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle concurrent file reads in sandbox',
    async () => {
      const testDir = getTestDir();

      // Create multiple test files
      const createFilesCode = `
        const fs = require('fs');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        for (let i = 1; i <= 5; i++) {
          fs.writeFileSync(\`file\${i}.txt\`, \`Content of file \${i}\`);
        }
        console.log('Multiple files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await readFiles.execute({
        context: {
          files: [
            `${testDir}/file1.txt`,
            `${testDir}/file2.txt`,
            `${testDir}/file3.txt`,
            `${testDir}/file4.txt`,
            `${testDir}/file5.txt`,
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(5);
      result.results.forEach((fileResult, index) => {
        expect(fileResult).toEqual({
          status: 'success',
          file_path: `${testDir}/file${index + 1}.txt`,
          content: `Content of file ${index + 1}`,
          truncated: false,
        });
      });
    },
    65000
  );

  it('should return error when no sandbox is available', async () => {
    // Create runtime context without sandbox
    const runtimeContext = new RuntimeContext();

    // This should return error since sandbox is required
    const result = await readFiles.execute({
      context: {
        files: ['test.txt'],
      },
      runtimeContext,
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'error',
      file_path: 'test.txt',
      error_message: 'File reading requires sandbox environment',
    });
  });
});
