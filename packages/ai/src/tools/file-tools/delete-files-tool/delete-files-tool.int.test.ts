import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../agents/docs-agent/docs-agent-context';
import { deleteFiles } from './delete-files-tool';

describe.sequential('delete-files-tool integration test', () => {
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
    'should delete files in sandbox environment',
    async () => {
      const testDir = getTestDir();

      // First, create test files in isolated directory
      const createFilesCode = `
      const fs = require('fs');
      
      fs.mkdirSync('${testDir}', { recursive: true });
      process.chdir('${testDir}');
      
      fs.writeFileSync('delete1.txt', 'File to delete 1');
      fs.writeFileSync('delete2.txt', 'File to delete 2');
      fs.mkdirSync('subdir', { recursive: true });
      fs.writeFileSync('subdir/delete3.txt', 'File to delete 3');
      
      console.log('Files created');
    `;

      await sharedSandbox.process.codeRun(createFilesCode);

      // Now test deleting files with the tool
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await deleteFiles.execute({
        context: {
          paths: [
            `${testDir}/delete1.txt`,
            `${testDir}/delete2.txt`,
            `${testDir}/subdir/delete3.txt`,
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([
        {
          status: 'success',
          path: `${testDir}/delete1.txt`,
        },
        {
          status: 'success',
          path: `${testDir}/delete2.txt`,
        },
        {
          status: 'success',
          path: `${testDir}/subdir/delete3.txt`,
        },
      ]);

      // Verify files were actually deleted
      const verifyCode = `
        const fs = require('fs');
        const files = ['${testDir}/delete1.txt', '${testDir}/delete2.txt', '${testDir}/subdir/delete3.txt'];
        const results: Record<string, boolean> = {};
        for (const file of files) {
          results[file] = fs.existsSync(file);
        }
        console.log(JSON.stringify(results));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      const fileExists = JSON.parse(verifyResult.result);

      expect(fileExists[`${testDir}/delete1.txt`]).toBe(false);
      expect(fileExists[`${testDir}/delete2.txt`]).toBe(false);
      expect(fileExists[`${testDir}/subdir/delete3.txt`]).toBe(false);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle non-existent files gracefully',
    async () => {
      const testDir = getTestDir();
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await deleteFiles.execute({
        context: {
          paths: [`${testDir}/nonexistent1.txt`, `${testDir}/nonexistent2.txt`],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results).toEqual([
        {
          status: 'error',
          path: `${testDir}/nonexistent1.txt`,
          error_message: 'File not found',
        },
        {
          status: 'error',
          path: `${testDir}/nonexistent2.txt`,
          error_message: 'File not found',
        },
      ]);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle mixed success and failure',
    async () => {
      const testDir = getTestDir();

      // Create some files but not all in isolated directory
      const createFilesCode = `
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        fs.writeFileSync('exists1.txt', 'This file exists');
        fs.writeFileSync('exists2.txt', 'This file also exists');
        console.log('Files created');
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await deleteFiles.execute({
        context: {
          paths: [
            `${testDir}/exists1.txt`,
            `${testDir}/does-not-exist.txt`,
            `${testDir}/exists2.txt`,
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(3);
      expect(result.results).toEqual([
        {
          status: 'success',
          path: `${testDir}/exists1.txt`,
        },
        {
          status: 'error',
          path: `${testDir}/does-not-exist.txt`,
          error_message: 'File not found',
        },
        {
          status: 'success',
          path: `${testDir}/exists2.txt`,
        },
      ]);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle absolute paths',
    async () => {
      const testDir = getTestDir();

      // Create a file with absolute path
      const createFileCode = `
        const fs = require('fs');
        fs.mkdirSync('/tmp/${testDir}', { recursive: true });
        fs.writeFileSync('/tmp/${testDir}/absolute-delete-test.txt', 'Absolute path file');
        console.log('File created');
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await deleteFiles.execute({
        context: {
          paths: [`/tmp/${testDir}/absolute-delete-test.txt`],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results).toEqual([
        {
          status: 'success',
          path: `/tmp/${testDir}/absolute-delete-test.txt`,
        },
      ]);

      // Verify file was deleted
      const verifyCode = `
        const fs = require('fs');
        const exists = fs.existsSync('/tmp/${testDir}/absolute-delete-test.txt');
        console.log(JSON.stringify(exists));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      expect(JSON.parse(verifyResult.result)).toBe(false);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should prevent deletion of directories',
    async () => {
      const testDir = getTestDir();

      // Create a directory
      const createDirCode = `
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
        fs.mkdirSync('${testDir}/test-directory', { recursive: true });
        console.log('Directory created');
      `;

      await sharedSandbox.process.codeRun(createDirCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await deleteFiles.execute({
        context: {
          paths: [`${testDir}/test-directory`],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results).toEqual([
        {
          status: 'error',
          path: `${testDir}/test-directory`,
          error_message: 'Cannot delete directories with this tool',
        },
      ]);

      // Verify directory still exists
      const verifyCode = `
        const fs = require('fs');
        const exists = fs.existsSync('${testDir}/test-directory');
        const isDir = exists && fs.statSync('${testDir}/test-directory').isDirectory();
        console.log(JSON.stringify({ exists: exists, isDir: isDir }));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      const status = JSON.parse(verifyResult.result);
      expect(status.exists).toBe(true);
      expect(status.isDir).toBe(true);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle permission errors gracefully',
    async () => {
      const testDir = getTestDir();
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      // Try to delete a system file (should fail with permission error)
      const result = await deleteFiles.execute({
        context: {
          paths: [
            '/etc/passwd', // System file, should not be deletable
            `${testDir}/regular-file.txt`, // Non-existent file
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);

      // Both should fail, but for different reasons
      const passwdResult = result.results.find((r) => r.path === '/etc/passwd');
      expect(passwdResult?.status).toBe('error');
      if (passwdResult?.status === 'error') {
        expect(passwdResult.error_message).toBeDefined();
      }

      const regularFileResult = result.results.find(
        (r) => r.path === `${testDir}/regular-file.txt`
      );
      expect(regularFileResult?.status).toBe('error');
      if (regularFileResult?.status === 'error') {
        expect(regularFileResult.error_message).toBe('File not found');
      }
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle files with spaces in names',
    async () => {
      const testDir = getTestDir();

      // Create a file with spaces in the name
      const createFileCode = `
        const fs = require('fs');
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        fs.writeFileSync('file with spaces.txt', 'Content with spaces');
        console.log('File created');
      `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await deleteFiles.execute({
        context: {
          paths: [`${testDir}/file with spaces.txt`],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results).toEqual([
        {
          status: 'success',
          path: `${testDir}/file with spaces.txt`,
        },
      ]);

      // Verify file was deleted
      const verifyCode = `
        const fs = require('fs');
        const exists = fs.existsSync('${testDir}/file with spaces.txt');
        console.log(JSON.stringify(exists));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      expect(JSON.parse(verifyResult.result)).toBe(false);
    },
    65000
  );
});
