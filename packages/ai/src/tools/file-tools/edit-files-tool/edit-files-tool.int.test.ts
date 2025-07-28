import { type Sandbox, createSandbox } from '@buster/sandbox';
import { RuntimeContext } from '@mastra/core/runtime-context';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DocsAgentContextKeys } from '../../../context/docs-agent-context';
import { editFiles } from './edit-files-tool';

describe('edit-files-tool integration test', () => {
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

  it.skipIf(!hasApiKey)('should edit files in sandbox environment', async () => {
    // First, create test files
    const createFilesCode = `
      const fs = require('fs');
      
      fs.writeFileSync('edit1.txt', 'Hello world\\nThis is a test file\\nGoodbye world');
      fs.writeFileSync('edit2.txt', 'First line\\nSecond line\\nThird line');
      
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    // Now test editing files with the tool
    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await editFiles.execute({
      context: {
        edits: [
          {
            filePath: 'edit1.txt',
            findString: 'This is a test file',
            replaceString: 'This is an edited file',
          },
          {
            filePath: 'edit2.txt',
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
      file_path: 'edit1.txt',
      message:
        'Successfully replaced "This is a test file" with "This is an edited file" in edit1.txt',
    });
    expect(result.results[1]).toEqual({
      status: 'success',
      file_path: 'edit2.txt',
      message: 'Successfully replaced "Second line" with "Modified second line" in edit2.txt',
    });
    expect(result.summary).toEqual({
      total: 2,
      successful: 2,
      failed: 0,
    });

    // Verify files were actually edited
    const verifyCode = `
      const fs = require('fs');
      const content1 = fs.readFileSync('edit1.txt', 'utf-8');
      const content2 = fs.readFileSync('edit2.txt', 'utf-8');
      console.log(JSON.stringify({ content1, content2 }));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const contents = JSON.parse(verifyResult.result);

    expect(contents.content1).toBe('Hello world\nThis is an edited file\nGoodbye world');
    expect(contents.content2).toBe('First line\nModified second line\nThird line');
  });

  it.skipIf(!hasApiKey)('should handle find string not found', async () => {
    // Create a test file
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('notfound.txt', 'Some content here');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await editFiles.execute({
      context: {
        edits: [
          {
            filePath: 'notfound.txt',
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
  });

  it.skipIf(!hasApiKey)('should handle multiple occurrences error', async () => {
    // Create a test file with repeated text
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('multiple.txt', 'Hello world\\nHello again\\nGoodbye world');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await editFiles.execute({
      context: {
        edits: [
          {
            filePath: 'multiple.txt',
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
  });

  it.skipIf(!hasApiKey)('should handle special characters in find/replace strings', async () => {
    // Create a test file with special characters
    const createFileCode = `
      const fs = require('fs');
      fs.writeFileSync('special.txt', 'Price: $10.99\\nRegex: /test/\\nPath: C:\\\\Users\\\\file.txt');
      console.log('File created');
    `;

    await sandbox.process.codeRun(createFileCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await editFiles.execute({
      context: {
        edits: [
          {
            filePath: 'special.txt',
            findString: '$10.99',
            replaceString: '$15.99',
          },
          {
            filePath: 'special.txt',
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
      const content = fs.readFileSync('special.txt', 'utf-8');
      console.log(JSON.stringify(content));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const content = JSON.parse(verifyResult.result);
    expect(content).toContain('$15.99');
    expect(content).toContain('/prod/');
  });

  it.skipIf(!hasApiKey)('should handle bulk edits with mixed results', async () => {
    // Create multiple test files
    const createFilesCode = `
      const fs = require('fs');
      fs.writeFileSync('bulk1.txt', 'File 1 content to edit');
      fs.writeFileSync('bulk2.txt', 'File 2 content to edit');
      fs.writeFileSync('bulk3.txt', 'File 3 different content');
      console.log('Files created');
    `;

    await sandbox.process.codeRun(createFilesCode);

    const runtimeContext = new RuntimeContext();
    runtimeContext.set(DocsAgentContextKeys.Sandbox, sandbox);

    const result = await editFiles.execute({
      context: {
        edits: [
          {
            filePath: 'bulk1.txt',
            findString: 'content to edit',
            replaceString: 'modified content',
          },
          {
            filePath: 'bulk2.txt',
            findString: 'content to edit',
            replaceString: 'updated content',
          },
          {
            filePath: 'bulk3.txt',
            findString: 'nonexistent',
            replaceString: 'replacement',
          },
          {
            filePath: 'nonexistent.txt',
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
      const content1 = fs.readFileSync('bulk1.txt', 'utf-8');
      const content2 = fs.readFileSync('bulk2.txt', 'utf-8');
      console.log(JSON.stringify({ content1, content2 }));
    `;

    const verifyResult = await sandbox.process.codeRun(verifyCode);
    const contents = JSON.parse(verifyResult.result);
    expect(contents.content1).toBe('File 1 modified content');
    expect(contents.content2).toBe('File 2 updated content');
  });
});
