import * as fs from 'node:fs/promises';
import { runTypescript } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRepositoryTree } from './tree-helper';

vi.mock('node:fs/promises');
vi.mock('@buster/sandbox');

describe('tree-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRepositoryTree', () => {
    it('should execute tree command with gitignore option', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;
      const mockTreeOutput = {
        success: true,
        output: `.
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── README.md

2 directories, 4 files`,
        command: 'tree --gitignore "."',
      };

      vi.mocked(fs.readFile).mockResolvedValue('mock script content');
      vi.mocked(runTypescript).mockResolvedValue({
        result: JSON.stringify(mockTreeOutput),
        exitCode: 0,
        stderr: '',
      });

      const result = await getRepositoryTree(mockSandbox, '.', { gitignore: true });

      expect(result).toEqual(mockTreeOutput);
      const expectedArg = Buffer.from(
        JSON.stringify({ path: '.', options: { gitignore: true } })
      ).toString('base64');
      expect(runTypescript).toHaveBeenCalledWith(mockSandbox, 'mock script content', {
        argv: [expectedArg],
      });
    });

    it('should use default options when none provided', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;
      vi.mocked(fs.readFile).mockResolvedValue('mock script content');
      vi.mocked(runTypescript).mockResolvedValue({
        result: JSON.stringify({ success: true, output: 'tree output' }),
        exitCode: 0,
        stderr: '',
      });

      await getRepositoryTree(mockSandbox);

      const expectedArg = Buffer.from(
        JSON.stringify({ path: '.', options: { gitignore: true } })
      ).toString('base64');
      expect(runTypescript).toHaveBeenCalledWith(mockSandbox, 'mock script content', {
        argv: [expectedArg],
      });
    });

    it('should handle tree command not installed error', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;
      const errorResponse = {
        success: false,
        error: 'tree command not installed. Please install tree to use this functionality.',
        command: 'tree --gitignore "."',
      };

      vi.mocked(fs.readFile).mockResolvedValue('mock script content');
      vi.mocked(runTypescript).mockResolvedValue({
        result: JSON.stringify(errorResponse),
        exitCode: 0,
        stderr: '',
      });

      const result = await getRepositoryTree(mockSandbox);

      expect(result).toEqual(errorResponse);
    });

    it('should handle sandbox execution failure', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;

      vi.mocked(fs.readFile).mockResolvedValue('mock script content');
      vi.mocked(runTypescript).mockResolvedValue({
        result: '',
        exitCode: 1,
        stderr: 'Sandbox error',
      });

      const result = await getRepositoryTree(mockSandbox);

      expect(result).toEqual({
        success: false,
        error: 'Sandbox execution failed: Sandbox error',
      });
    });

    it('should handle JSON parse errors in result', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;

      vi.mocked(fs.readFile).mockResolvedValue('mock script content');
      vi.mocked(runTypescript).mockResolvedValue({
        result: 'invalid json',
        exitCode: 0,
        stderr: '',
      });

      const result = await getRepositoryTree(mockSandbox);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to parse tree output');
    });

    it('should handle file read errors', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;

      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      const result = await getRepositoryTree(mockSandbox);

      expect(result).toEqual({
        success: false,
        error: 'File not found',
      });
    });

    it('should pass custom options correctly', async () => {
      const mockSandbox = { id: 'test-sandbox' } as any;
      vi.mocked(fs.readFile).mockResolvedValue('mock script content');
      vi.mocked(runTypescript).mockResolvedValue({
        result: JSON.stringify({ success: true }),
        exitCode: 0,
        stderr: '',
      });

      await getRepositoryTree(mockSandbox, 'src', {
        gitignore: false,
        maxDepth: 2,
        dirsOnly: true,
        pattern: '*.ts',
      });

      const expectedArg = Buffer.from(
        JSON.stringify({
          path: 'src',
          options: { gitignore: false, maxDepth: 2, dirsOnly: true, pattern: '*.ts' },
        })
      ).toString('base64');
      expect(runTypescript).toHaveBeenCalledWith(mockSandbox, 'mock script content', {
        argv: [expectedArg],
      });
    });
  });
});