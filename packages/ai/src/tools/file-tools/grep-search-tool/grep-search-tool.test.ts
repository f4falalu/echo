import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GrepSearchToolInputSchema, createGrepSearchTool } from './grep-search-tool';

vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

describe('grep-search-tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('factory pattern tool', () => {
    it('should create tool with factory function', () => {
      const mockContext = {
        messageId: 'test-message-id',
        sandbox: {
          id: 'test-sandbox',
          process: {
            executeCommand: vi.fn(),
          },
        } as unknown as Sandbox,
      };

      const tool = createGrepSearchTool(mockContext);
      expect(tool.description).toContain('Executes ripgrep (rg) commands');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.execute).toBeDefined();
      expect(tool.onInputStart).toBeDefined();
      expect(tool.onInputDelta).toBeDefined();
      expect(tool.onInputAvailable).toBeDefined();
    });

    it('should validate input schema correctly', () => {
      const validInput = {
        commands: ['rg "test" file.txt', 'rg -i "hello" *.js'],
      };

      const result = GrepSearchToolInputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it('should reject input with empty commands array', () => {
      const invalidInput = {
        commands: [],
      };

      const result = GrepSearchToolInputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it('should execute ripgrep commands successfully', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        process: {
          executeCommand: vi.fn(),
        },
      } as unknown as Sandbox;

      mockSandbox.process.executeCommand
        .mockResolvedValueOnce({
          result: 'file.txt:1:This is a test line',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: 'file.js:2:console.log("hello world");',
          exitCode: 0,
        });

      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const result = await tool.execute({
        commands: ['rg "test" file.txt', 'rg -i "hello" file.js'],
      });

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('rg "test" file.txt');
      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith('rg -i "hello" file.js');
      expect(result.results).toHaveLength(2);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[0]?.stdout).toBe('file.txt:1:This is a test line');
      expect(result.results[1]?.success).toBe(true);
      expect(result.results[1]?.stdout).toBe('file.js:2:console.log("hello world");');
    });

    it('should handle ripgrep no matches (exit code 1) as success', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        process: {
          executeCommand: vi.fn(),
        },
      } as unknown as Sandbox;

      mockSandbox.process.executeCommand.mockResolvedValue({
        result: '',
        exitCode: 1,
      });

      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const result = await tool.execute({
        commands: ['rg "nonexistent" file.txt'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[0]?.stdout).toBe('');
    });

    it('should handle command execution errors', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        process: {
          executeCommand: vi.fn(),
        },
      } as unknown as Sandbox;

      mockSandbox.process.executeCommand.mockResolvedValue({
        result: 'rg: error: file not found',
        exitCode: 2,
      });

      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const result = await tool.execute({
        commands: ['rg "test" /nonexistent/file.txt'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.stderr).toBe('rg: error: file not found');
      expect(result.results[0]?.error).toContain('Command failed with exit code 2');
    });

    it('should handle sandbox execution exceptions', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        process: {
          executeCommand: vi.fn(),
        },
      } as unknown as Sandbox;

      mockSandbox.process.executeCommand.mockRejectedValue(new Error('Network error'));

      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const result = await tool.execute({
        commands: ['rg "test" file.txt'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('Execution error: Network error');
    });

    it('should return error when sandbox not available', async () => {
      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: null as any,
      });

      const result = await tool.execute({
        commands: ['rg "test" file.txt'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(false);
      expect(result.results[0]?.error).toBe('ripgrep command requires sandbox environment');
    });

    it('should handle empty commands array', async () => {
      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: {} as any,
      });

      // This should not be allowed by schema, but test the execution behavior
      const result = await tool.execute({ commands: [] } as any);

      expect(result.message).toBe('No commands provided');
      expect(result.results).toHaveLength(0);
    });

    it('should execute multiple commands concurrently', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        process: {
          executeCommand: vi.fn(),
        },
      } as unknown as Sandbox;

      // Mock three different commands
      mockSandbox.process.executeCommand
        .mockResolvedValueOnce({
          result: 'file1.txt:1:test content',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: 'file2.txt:2:hello world',
          exitCode: 0,
        })
        .mockResolvedValueOnce({
          result: '',
          exitCode: 1,
        });

      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const result = await tool.execute({
        commands: ['rg "test" file1.txt', 'rg "hello" file2.txt', 'rg "missing" file3.txt'],
      });

      expect(result.results).toHaveLength(3);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[0]?.stdout).toBe('file1.txt:1:test content');
      expect(result.results[1]?.success).toBe(true);
      expect(result.results[1]?.stdout).toBe('file2.txt:2:hello world');
      expect(result.results[2]?.success).toBe(true);
      expect(result.results[2]?.stdout).toBe('');
    });

    it('should handle complex ripgrep commands with flags', async () => {
      const mockSandbox = {
        id: 'test-sandbox',
        process: {
          executeCommand: vi.fn(),
        },
      } as unknown as Sandbox;

      mockSandbox.process.executeCommand.mockResolvedValue({
        result: '{"type":"match","data":{"path":{"text":"file.ts"}}}',
        exitCode: 0,
      });

      const tool = createGrepSearchTool({
        messageId: 'test-message-id',
        sandbox: mockSandbox,
      });

      const result = await tool.execute({
        commands: ['rg --json --type ts "function" src/'],
      });

      expect(mockSandbox.process.executeCommand).toHaveBeenCalledWith(
        'rg --json --type ts "function" src/'
      );
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.success).toBe(true);
      expect(result.results[0]?.stdout).toContain('match');
    });
  });
});
