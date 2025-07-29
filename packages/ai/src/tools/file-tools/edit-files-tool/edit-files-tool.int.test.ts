import { createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { editFiles } from './edit-files-tool';

describe.sequential('edit-files-tool integration test', () => {
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
    'should edit files in sandbox environment',
    async () => {
      const testDir = getTestDir();

      // First, create test files in isolated directory
      const createFilesCode = `
        const fs = require('fs');
        const path = require('path');
        
        // Create and enter test directory
        fs.mkdirSync('${testDir}', { recursive: true });
        process.chdir('${testDir}');
        
        fs.writeFileSync('edit1.txt', 'Hello world\\nThis is a test file\\nGoodbye world');
        fs.writeFileSync('edit2.txt', 'First line\\nSecond line\\nThird line');
        
        console.log('Files created in ' + process.cwd());
      `;

      await sharedSandbox.process.codeRun(createFilesCode);

      // Now test editing files with the tool
      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await editFiles.execute({
        context: {
          edits: [
            {
              filePath: `${testDir}/edit1.txt`,
              findString: 'This is a test file',
              replaceString: 'This is an edited file',
            },
            {
              filePath: `${testDir}/edit2.txt`,
              findString: 'Second line',
              replaceString: 'Modified second line',
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({
        status: 'success',
        file_path: `${testDir}/edit1.txt`,
        message: `Successfully replaced "This is a test file" with "This is an edited file" in ${testDir}/edit1.txt`,
      });
      expect(result.results[1]).toEqual({
        status: 'success',
        file_path: `${testDir}/edit2.txt`,
        message: `Successfully replaced "Second line" with "Modified second line" in ${testDir}/edit2.txt`,
      });
      expect(result.summary).toEqual({
        total: 2,
        successful: 2,
        failed: 0,
      });

      // Verify files were actually edited
      const verifyCode = `
        const fs = require('fs');
        const content1 = fs.readFileSync('${testDir}/edit1.txt', 'utf-8');
        const content2 = fs.readFileSync('${testDir}/edit2.txt', 'utf-8');
        console.log(JSON.stringify({ content1: content1, content2: content2 }));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      const contents = JSON.parse(verifyResult.result);

      expect(contents.content1).toBe('Hello world\nThis is an edited file\nGoodbye world');
      expect(contents.content2).toBe('First line\nModified second line\nThird line');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle find string not found',
    async () => {
      const testDir = getTestDir();

      // Create a test file in isolated directory
      const createFileCode = `
      const fs = require('fs');
      fs.mkdirSync('${testDir}', { recursive: true });
      process.chdir('${testDir}');
      fs.writeFileSync('notfound.txt', 'Some content here');
      console.log('File created');
    `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await editFiles.execute({
        context: {
          edits: [
            {
              filePath: `${testDir}/notfound.txt`,
              findString: 'nonexistent text',
              replaceString: 'replacement',
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toContain('Find string not found');
      }
      expect(result.summary.failed).toBe(1);
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle multiple occurrences error',
    async () => {
      const testDir = getTestDir();

      // Create a test file with repeated text in isolated directory
      const createFileCode = `
      const fs = require('fs');
      fs.mkdirSync('${testDir}', { recursive: true });
      process.chdir('${testDir}');
      fs.writeFileSync('multiple.txt', 'Hello world\\nHello again\\nGoodbye world');
      console.log('File created');
    `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await editFiles.execute({
        context: {
          edits: [
            {
              filePath: `${testDir}/multiple.txt`,
              findString: 'Hello',
              replaceString: 'Hi',
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toContain('appears 2 times');
        expect(result.results[0].error_message).toContain('more specific string');
      }
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle special characters in find/replace strings',
    async () => {
      const testDir = getTestDir();

      // Create a test file with special characters in isolated directory
      const createFileCode = `
      const fs = require('fs');
      fs.mkdirSync('${testDir}', { recursive: true });
      process.chdir('${testDir}');
      fs.writeFileSync('special.txt', 'Price: $10.99\\nRegex: /test/\\nPath: C:\\\\Users\\\\file.txt');
      console.log('File created');
    `;

      await sharedSandbox.process.codeRun(createFileCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await editFiles.execute({
        context: {
          edits: [
            {
              filePath: `${testDir}/special.txt`,
              findString: '$10.99',
              replaceString: '$15.99',
            },
            {
              filePath: `${testDir}/special.txt`,
              findString: '/test/',
              replaceString: '/prod/',
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results.every((r) => r.status === 'success')).toBe(true);
      expect(result.summary.successful).toBe(2);

      // Verify the edits
      const verifyCode = `
        const fs = require('fs');
        const content = fs.readFileSync('${testDir}/special.txt', 'utf-8');
        console.log(JSON.stringify(content));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      const content = JSON.parse(verifyResult.result);
      expect(content).toContain('$15.99');
      expect(content).toContain('/prod/');
    },
    65000
  );

  (hasApiKey ? it : it.skip)(
    'should handle bulk edits with mixed results',
    async () => {
      const testDir = getTestDir();

      // Create multiple test files in isolated directory
      const createFilesCode = `
      const fs = require('fs');
      fs.mkdirSync('${testDir}', { recursive: true });
      process.chdir('${testDir}');
      fs.writeFileSync('bulk1.txt', 'File 1 content to edit');
      fs.writeFileSync('bulk2.txt', 'File 2 content to edit');
      fs.writeFileSync('bulk3.txt', 'File 3 different content');
      console.log('Files created');
    `;

      await sharedSandbox.process.codeRun(createFilesCode);

      const runtimeContext = new RuntimeContext();
      runtimeContext.set(DocsAgentContextKeys.Sandbox, sharedSandbox);

      const result = await editFiles.execute({
        context: {
          edits: [
            {
              filePath: `${testDir}/bulk1.txt`,
              findString: 'content to edit',
              replaceString: 'modified content',
            },
            {
              filePath: `${testDir}/bulk2.txt`,
              findString: 'content to edit',
              replaceString: 'updated content',
            },
            {
              filePath: `${testDir}/bulk3.txt`,
              findString: 'nonexistent',
              replaceString: 'replacement',
            },
            {
              filePath: `${testDir}/nonexistent.txt`,
              findString: 'test',
              replaceString: 'replacement',
            },
          ],
        },
        runtimeContext,
      });

      expect(result.results).toHaveLength(4);
      expect(result.summary.total).toBe(4);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(2);

      // Verify successful edits
      const verifyCode = `
        const fs = require('fs');
        const content1 = fs.readFileSync('${testDir}/bulk1.txt', 'utf-8');
        const content2 = fs.readFileSync('${testDir}/bulk2.txt', 'utf-8');
        console.log(JSON.stringify({ content1: content1, content2: content2 }));
      `;

      const verifyResult = await sharedSandbox.process.codeRun(verifyCode);
      const contents = JSON.parse(verifyResult.result);
      expect(contents.content1).toBe('File 1 modified content');
      expect(contents.content2).toBe('File 2 updated content');
    },
    65000
  );
});
