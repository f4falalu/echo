import { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocsAgentContextKeys } from '../../../agents/docs-agent/docs-agent-context';
import { listFiles } from './list-files-tool';

describe('list-files-tool', () => {
  let runtimeContext: RuntimeContext<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    runtimeContext = new RuntimeContext();
  });

  describe('listFiles tool', () => {
    it('should have correct tool definition', () => {
      expect(listFiles.id).toBe('list-files');
      expect(listFiles.description).toContain('Displays the directory structure');
      expect(listFiles.inputSchema).toBeDefined();
      expect(listFiles.outputSchema).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        paths: ['/test/path'],
        options: { depth: 2, all: false },
      };

      const result = listFiles.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should validate output schema correctly', () => {
      const validOutput = {
        results: [
          {
            status: 'success' as const,
            path: '/test/path',
            output: 'test/path\n├── file1.txt\n├── file2.js\n└── subfolder/\n    └── file3.md',
            currentDirectory: '/home/user',
          },
        ],
      };

      const result = listFiles.outputSchema.safeParse(validOutput);
      expect(result.success).toBe(true);
    });

    it('should execute with sandbox when available', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn(),
        },
      };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockSandbox.process.executeCommand
        .mockResolvedValueOnce({
          result: 'test/path\n├── file1.txt\n└── file2.js',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: '/home/user\n',
          exitCode: 0,
        });

      const result = await listFiles.execute({
        context: { paths: ['/test/path'] },
        runtimeContext,
      });

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'tree --gitignore "/test/path"'
      );
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('pwd');
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('success');
      if (result.results[0]?.status === 'success') {
        expect(result.results[0].output).toContain('file1.txt');
        expect(result.results[0].currentDirectory).toBe('/home/user');
      }
    });

    it('should handle options correctly', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn(),
        },
      };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockSandbox.process.executeCommand
        .mockResolvedValueOnce({
          result: 'test/path\n├── file1.txt\n└── subdir/',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: '/home/user\n',
          exitCode: 0,
        });

      const result = await listFiles.execute({
        context: {
          paths: ['/test/path'],
          options: {
            depth: 2,
            all: true,
            dirsOnly: true,
            ignorePattern: '*.log',
            followSymlinks: true,
          },
        },
        runtimeContext,
      });

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'tree --gitignore -L 2 -a -d -l -I *.log "/test/path"'
      );
    });

    it('should return error when sandbox not available', async () => {
      // Don't set sandbox in runtime context
      const result = await listFiles.execute({
        context: { paths: ['/test/path'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toBe('tree command requires sandbox environment');
      }
    });

    it('should handle command execution failure', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn(),
        },
      };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockSandbox.process.executeCommand.mockResolvedValue({
        result: 'tree: /nonexistent: No such file or directory',
        exitCode: 1,
      });

      const result = await listFiles.execute({
        context: { paths: ['/nonexistent'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toContain('No such file or directory');
      }
    });

    it('should handle empty paths array', async () => {
      const result = await listFiles.execute({
        context: { paths: [] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(0);
    });

    it('should handle multiple paths', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn(),
        },
      };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockSandbox.process.executeCommand
        .mockResolvedValueOnce({
          result: 'path1\n└── file1.txt',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: '/home/user\n',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: 'path2\n└── file2.txt',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: '/home/user\n',
          exitCode: 0,
        });

      const result = await listFiles.execute({
        context: { paths: ['/path1', '/path2'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.status).toBe('success');
      expect(result.results[1]?.status).toBe('success');
    });

    it('should handle exception during execution', async () => {
      const mockSandbox = {
        process: {
          executeCommand: vi.fn(),
        },
      };
      runtimeContext.set(DocsAgentContextKeys.Sandbox, mockSandbox);

      mockSandbox.process.executeCommand.mockRejectedValue(new Error('Network error'));

      const result = await listFiles.execute({
        context: { paths: ['/test/path'] },
        runtimeContext,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe('error');
      if (result.results[0]?.status === 'error') {
        expect(result.results[0].error_message).toBe('Network error');
      }
    });
  });
});
