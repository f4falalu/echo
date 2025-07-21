import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createFilesSafely, generateFileCreateCode, type FileCreateParams } from './create-file-functions';

vi.mock('node:fs/promises');
const mockFs = vi.mocked(fs);

describe('create-file-functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFilesSafely', () => {
    it('should create files successfully', async () => {
      const fileParams: FileCreateParams[] = [
        { path: '/test/file1.txt', content: 'content1' },
        { path: '/test/file2.txt', content: 'content2' },
      ];

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const results = await createFilesSafely(fileParams);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        success: true,
        filePath: '/test/file1.txt',
      });
      expect(results[1]).toEqual({
        success: true,
        filePath: '/test/file2.txt',
      });

      expect(mockFs.mkdir).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith('/test/file1.txt', 'content1', 'utf-8');
      expect(mockFs.writeFile).toHaveBeenCalledWith('/test/file2.txt', 'content2', 'utf-8');
    });

    it('should handle relative paths correctly', async () => {
      const fileParams: FileCreateParams[] = [
        { path: 'relative/file.txt', content: 'content' },
      ];

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      const results = await createFilesSafely(fileParams);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        success: true,
        filePath: 'relative/file.txt',
      });

      const expectedPath = path.join(process.cwd(), 'relative/file.txt');
      const expectedDir = path.dirname(expectedPath);
      
      expect(mockFs.mkdir).toHaveBeenCalledWith(expectedDir, { recursive: true });
      expect(mockFs.writeFile).toHaveBeenCalledWith(expectedPath, 'content', 'utf-8');
    });

    it('should handle directory creation errors', async () => {
      const fileParams: FileCreateParams[] = [
        { path: '/test/file.txt', content: 'content' },
      ];

      mockFs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const results = await createFilesSafely(fileParams);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        success: false,
        filePath: '/test/file.txt',
        error: 'Failed to create directory: Permission denied',
      });
    });

    it('should handle file write errors', async () => {
      const fileParams: FileCreateParams[] = [
        { path: '/test/file.txt', content: 'content' },
      ];

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error('Disk full'));

      const results = await createFilesSafely(fileParams);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        success: false,
        filePath: '/test/file.txt',
        error: 'Disk full',
      });
    });

    it('should continue processing other files when one fails', async () => {
      const fileParams: FileCreateParams[] = [
        { path: '/test/file1.txt', content: 'content1' },
        { path: '/test/file2.txt', content: 'content2' },
      ];

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile
        .mockRejectedValueOnce(new Error('File 1 error'))
        .mockResolvedValueOnce(undefined);

      const results = await createFilesSafely(fileParams);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        success: false,
        filePath: '/test/file1.txt',
        error: 'File 1 error',
      });
      expect(results[1]).toEqual({
        success: true,
        filePath: '/test/file2.txt',
      });
    });

    it('should handle empty file params array', async () => {
      const results = await createFilesSafely([]);
      expect(results).toEqual([]);
    });
  });

  describe('generateFileCreateCode', () => {
    it('should generate valid TypeScript code for file creation', () => {
      const fileParams: FileCreateParams[] = [
        { path: '/test/file1.txt', content: 'content1' },
        { path: '/test/file2.txt', content: 'content2' },
      ];

      const code = generateFileCreateCode(fileParams);

      expect(code).toContain('const fs = require(\'fs\');');
      expect(code).toContain('const path = require(\'path\');');
      expect(code).toContain('function createSingleFile(fileParams)');
      expect(code).toContain('function createFilesConcurrently(fileParams)');
      expect(code).toContain('fs.mkdirSync(dirPath, { recursive: true });');
      expect(code).toContain('fs.writeFileSync(resolvedPath, content, \'utf-8\');');
      expect(code).toContain('console.log(JSON.stringify(results));');
      expect(code).toContain(JSON.stringify(fileParams));
    });

    it('should handle empty file params array', () => {
      const code = generateFileCreateCode([]);
      expect(code).toContain('const fileParams = [];');
      expect(code).toContain('console.log(JSON.stringify(results));');
    });

    it('should escape special characters in file content', () => {
      const fileParams: FileCreateParams[] = [
        { path: '/test/file.txt', content: 'line1\nline2\ttab' },
      ];

      const code = generateFileCreateCode(fileParams);
      
      expect(code).toContain('"content":"line1\\nline2\\ttab"');
    });
  });
});
