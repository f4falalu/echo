import { exec } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { executeGrepSearchesLocally, generateGrepSearchCode } from './grep-search';

const execAsync = promisify(exec);

describe('grep-search', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'grep-search-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('executeGrepSearchesLocally - real file system tests', () => {
    it('should search for patterns in files', async () => {
      const file1Path = path.join(tempDir, 'file1.txt');
      const file2Path = path.join(tempDir, 'file2.txt');

      await fs.writeFile(file1Path, 'Hello world\nThis is a test\nAnother line');
      await fs.writeFile(file2Path, 'Different content\nHello again\nFinal line');

      const result = await executeGrepSearchesLocally([
        {
          path: file1Path,
          pattern: 'test',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      expect(result.successful_searches).toHaveLength(1);
      expect(result.successful_searches[0]).toBeDefined();
      expect(result.successful_searches[0]!.matches).toHaveLength(1);
      expect(result.successful_searches[0]!.matches[0]).toEqual({
        file: file1Path,
        lineNumber: 2,
        content: 'This is a test',
      });
    });

    it('should handle case-insensitive searches', async () => {
      const filePath = path.join(tempDir, 'case-test.txt');
      await fs.writeFile(filePath, 'Hello World\nHELLO world\nhello WORLD');

      const result = await executeGrepSearchesLocally([
        {
          path: filePath,
          pattern: 'hello',
          recursive: false,
          ignoreCase: true,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      expect(result.successful_searches[0]).toBeDefined();
      expect(result.successful_searches[0]!.matches).toHaveLength(3);
    });

    it('should handle recursive searches', async () => {
      const subDir = path.join(tempDir, 'subdir');
      await fs.mkdir(subDir);
      
      const file1 = path.join(tempDir, 'root.txt');
      const file2 = path.join(subDir, 'nested.txt');
      
      await fs.writeFile(file1, 'search term in root');
      await fs.writeFile(file2, 'search term in nested');

      const result = await executeGrepSearchesLocally([
        {
          path: tempDir,
          pattern: 'search term',
          recursive: true,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      expect(result.successful_searches[0]).toBeDefined();
      expect(result.successful_searches[0]!.matches).toHaveLength(2);
    });

    it('should handle non-existent files', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.txt');

      const result = await executeGrepSearchesLocally([
        {
          path: nonExistentPath,
          pattern: 'test',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      expect(result.failed_searches).toHaveLength(1);
      expect(result.failed_searches[0]).toEqual({
        path: nonExistentPath,
        pattern: 'test',
        error: `Path does not exist: ${nonExistentPath}`,
      });
    });

    it('should handle word matching', async () => {
      const filePath = path.join(tempDir, 'word-test.txt');
      await fs.writeFile(filePath, 'test testing tested\nword test word');

      const result = await executeGrepSearchesLocally([
        {
          path: filePath,
          pattern: 'test',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: true,
          fixedStrings: false,
        },
      ]);

      expect(result.successful_searches[0]).toBeDefined();
      expect(result.successful_searches[0]!.matches).toHaveLength(1);
      expect(result.successful_searches[0]!.matches[0]).toBeDefined();
      expect(result.successful_searches[0]!.matches[0]!.content).toBe('word test word');
    });
  });

  describe('generateGrepSearchCode', () => {
    it('should generate valid executable TypeScript code', async () => {
      const testFile = path.join(tempDir, 'code-gen-test.txt');
      await fs.writeFile(testFile, 'Generated code test content\nSecond line with pattern');

      const code = generateGrepSearchCode([
        {
          path: testFile,
          pattern: 'pattern',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      const codeFile = path.join(tempDir, 'test-generated.ts');
      await fs.writeFile(codeFile, code);

      try {
        const { stdout, stderr } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

        if (stderr) {
          console.error('Execution stderr:', stderr);
        }

        const results = JSON.parse(stdout.trim());

        expect(results).toHaveLength(1);
        expect(results[0]).toEqual({
          success: true,
          path: testFile,
          pattern: 'pattern',
          matches: [
            {
              file: testFile,
              lineNumber: 2,
              content: 'Second line with pattern',
            },
          ],
          matchCount: 1,
        });
      } catch (error) {
        console.error('Failed to execute generated code:', error);
        throw error;
      }
    });

    it('should handle multiple searches in generated code', async () => {
      const file1 = path.join(tempDir, 'gen1.txt');
      const file2 = path.join(tempDir, 'gen2.txt');

      await fs.writeFile(file1, 'First file content');
      await fs.writeFile(file2, 'Second file content');

      const code = generateGrepSearchCode([
        {
          path: file1,
          pattern: 'First',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
        {
          path: file2,
          pattern: 'Second',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      const codeFile = path.join(tempDir, 'test-multi.ts');
      await fs.writeFile(codeFile, code);

      const { stdout } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

      const results = JSON.parse(stdout.trim());

      expect(results).toHaveLength(2);
      expect(results[0]?.matches[0]?.content).toBe('First file content');
      expect(results[1]?.matches[0]?.content).toBe('Second file content');
    });

    it('should properly escape special characters in patterns', () => {
      const searches = [
        {
          path: 'test.txt',
          pattern: 'pattern"with"quotes',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
        {
          path: 'test2.txt',
          pattern: "pattern'with'apostrophes",
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ];

      const code = generateGrepSearchCode(searches);

      expect(code).toContain(`const searches = ${JSON.stringify(searches)}`);
      expect(code).toContain("const { execSync } = require('child_process')");
      expect(code).toContain("const fs = require('fs')");
    });

    it('should handle errors in generated code', async () => {
      const nonExistent = path.join(tempDir, 'does-not-exist.txt');

      const code = generateGrepSearchCode([
        {
          path: nonExistent,
          pattern: 'test',
          recursive: false,
          ignoreCase: false,
          invertMatch: false,
          lineNumbers: true,
          wordMatch: false,
          fixedStrings: false,
        },
      ]);

      const codeFile = path.join(tempDir, 'test-error.ts');
      await fs.writeFile(codeFile, code);

      const { stdout } = await execAsync(`npx tsx ${codeFile}`, { cwd: tempDir });

      const results = JSON.parse(stdout.trim());

      expect(results[0]).toEqual({
        success: false,
        path: nonExistent,
        pattern: 'test',
        error: `Path does not exist: ${nonExistent}`,
      });
    });
  });
});
