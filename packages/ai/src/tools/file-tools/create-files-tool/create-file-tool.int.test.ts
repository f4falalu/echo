import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../agents/docs-agent/docs-agent-context';
import { createFiles } from './create-file-tool';

describe.sequential('create-file-tool integration test', () => {
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
    'should create files in sandbox environment',
    async () => {
      const testDir = getTestDir();

      // Create isolated test directory
      await sharedSandbox.process.codeRun(`
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
      `);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await createFiles.execute({
        context: {
          files: [
            { path: `${testDir}/test1.txt`, content: 'Hello from test1' },
            { path: `${testDir}/test2.txt`, content: 'Hello from test2' },
            { path: `${testDir}/subdir/test3.txt`, content: 'Hello from subdirectory' },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: `${testDir}/test1.txt`,
      });
      expect(result.results[1]).toEqual({
        status: 'success',
        filePath: `${testDir}/test2.txt`,
      });
      expect(result.results[2]).toEqual({
        status: 'success',
        filePath: `${testDir}/subdir/test3.txt`,
      });

      // Verify files were actually created by reading them
      const verifyCode = `
        const fs = require('fs');
        const files = ['${testDir}/test1.txt', '${testDir}/test2.txt', '${testDir}/subdir/test3.txt'];
        const results: Record<string, string> = {};
        for (const file of files) {
          try {
            results[file] = fs.readFileSync(file, 'utf-8');
          } catch (err: any) {
            results[file] = 'ERROR: ' + err.message;
          }
        }
        console.log(JSON.stringify(results));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);

      // Parse the result
      const fileContents = JSON.parse(verifyResult.result.trim());

      expect(fileContents[`${testDir}/test1.txt`]).toBe('Hello from test1');
      expect(fileContents[`${testDir}/test2.txt`]).toBe('Hello from test2');
      expect(fileContents[`${testDir}/subdir/test3.txt`]).toBe('Hello from subdirectory');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle absolute paths in sandbox',
    async () => {
      const testDir = getTestDir();
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await createFiles.execute({
        context: {
          files: [{ path: `/tmp/${testDir}/absolute-test.txt`, content: 'Absolute path content' }],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: `/tmp/${testDir}/absolute-test.txt`,
      });

      // Verify the file was created
      const verifyCode = `
        const fs = require('fs');
        try {
          const content = fs.readFileSync('/tmp/${testDir}/absolute-test.txt', 'utf-8');
          console.log(JSON.stringify({ success: true, content: content }));
        } catch (error: any) {
          console.log(JSON.stringify({ success: false, error: error.message }));
        }
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      const verification = JSON.parse(verifyResult.result.trim());
      expect(verification.success).toBe(true);
      expect(verification.content).toBe('Absolute path content');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should overwrite existing files',
    async () => {
      const testDir = getTestDir();

      // Create isolated test directory
      await sharedSandbox.process.codeRun(`
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
      `);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      // First create a file
      await createFiles.execute({
        context: {
          files: [{ path: `${testDir}/overwrite-test.txt`, content: 'Original content' }],
        },
        runtimeContext,
      });

      // Then overwrite it
      const result = await createFiles.execute({
        context: {
          files: [{ path: `${testDir}/overwrite-test.txt`, content: 'New content' }],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: `${testDir}/overwrite-test.txt`,
      });

      // Verify the content was overwritten
      const verifyCode = `
        const fs = require('fs');
        const content = fs.readFileSync('${testDir}/overwrite-test.txt', 'utf-8');
        console.log(JSON.stringify(content));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      expect(JSON.parse(verifyResult.result.trim())).toBe('New content');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle special characters in content',
    async () => {
      const testDir = getTestDir();

      // Create isolated test directory
      await sharedSandbox.process.codeRun(`
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
      `);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const specialContent = 'Line 1\nLine 2\tTabbed\n"Quoted"\n\'Single quoted\'';

      const result = await createFiles.execute({
        context: {
          files: [{ path: `${testDir}/special-chars.txt`, content: specialContent }],
        },
        runtimeContext,
      });

      expect(result.results[0]).toEqual({
        status: 'success',
        filePath: `${testDir}/special-chars.txt`,
      });

      // Verify special characters were preserved
      const verifyCode = `
        const fs = require('fs');
        const content = fs.readFileSync('${testDir}/special-chars.txt', 'utf-8');
        console.log(JSON.stringify(content));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      expect(JSON.parse(verifyResult.result.trim())).toBe(specialContent);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle permission errors gracefully',
    async () => {
      const testDir = getTestDir();

      // Create isolated test directory
      await sharedSandbox.process.codeRun(`
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
      `);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      // Try to create a file in a restricted directory
      const result = await createFiles.execute({
        context: {
          files: [
            { path: '/root/restricted.txt', content: 'This should fail' },
            { path: `${testDir}/valid-file.txt`, content: 'This should succeed' },
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
        filePath: `${testDir}/valid-file.txt`,
      });
    },
    65000
  );
});
