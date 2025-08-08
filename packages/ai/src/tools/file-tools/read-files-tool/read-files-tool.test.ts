import { type Sandbox, createSandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type ReadFilesToolContext, createReadFilesTool } from './read-files-tool';

// Mock the database and braintrust
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('braintrust', () => ({
  wrapTraced: vi.fn().mockImplementation((fn: any) => fn),
}));

// Mock the sandbox module
vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
  createSandbox: vi.fn(),
}));

describe('createReadFilesTool', () => {
  let mockSandbox: Partial<Sandbox>;
  let context: ReadFilesToolContext;

  beforeEach(() => {
    mockSandbox = {
      id: 'test-sandbox-id',
      fs: {} as any,
    };

    context = {
      messageId: 'test-message-id',
      sandbox: mockSandbox as Sandbox,
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should create a tool with factory pattern', () => {
    const tool = createReadFilesTool(context);

    expect(tool).toBeDefined();
    expect(tool.description).toContain('Read the contents of one or more files');
    expect(tool.inputSchema).toBeDefined();
    expect(tool.outputSchema).toBeDefined();
    expect(typeof tool.execute).toBe('function');
    expect(typeof tool.onInputStart).toBe('function');
    expect(typeof tool.onInputDelta).toBe('function');
    expect(typeof tool.onInputAvailable).toBe('function');
  });

  it('should handle empty files array', async () => {
    const tool = createReadFilesTool(context);

    const result = await tool.execute({ files: [] });

    expect(result).toEqual({ results: [] });
  });

  it('should return errors when sandbox is not available', async () => {
    const contextWithoutSandbox = {
      messageId: 'test-message-id',
      sandbox: undefined as any,
    };

    const tool = createReadFilesTool(contextWithoutSandbox);

    const result = await tool.execute({
      files: ['test.txt', 'another.txt'],
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toEqual({
      status: 'error',
      file_path: 'test.txt',
      error_message: 'File reading requires sandbox environment',
    });
    expect(result.results[1]).toEqual({
      status: 'error',
      file_path: 'another.txt',
      error_message: 'File reading requires sandbox environment',
    });
  });

  it('should execute successfully with valid files', async () => {
    const { runTypescript } = await import('@buster/sandbox');
    const mockRunTypescript = vi.mocked(runTypescript);

    // Mock successful sandbox execution
    mockRunTypescript.mockResolvedValue({
      exitCode: 0,
      result: JSON.stringify([
        {
          success: true,
          filePath: 'test.txt',
          content: 'Hello world',
          truncated: false,
        },
      ]),
      stderr: '',
    });

    const tool = createReadFilesTool(context);

    const result = await tool.execute({
      files: ['test.txt'],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'success',
      file_path: 'test.txt',
      content: 'Hello world',
      truncated: false,
    });

    expect(mockRunTypescript).toHaveBeenCalledWith(
      mockSandbox,
      expect.stringContaining('fs.readFileSync')
    );
  });

  it('should handle sandbox execution failure', async () => {
    const { runTypescript } = await import('@buster/sandbox');
    const mockRunTypescript = vi.mocked(runTypescript);

    // Mock failed sandbox execution
    mockRunTypescript.mockResolvedValue({
      exitCode: 1,
      result: '',
      stderr: 'Command not found',
    });

    const tool = createReadFilesTool(context);

    const result = await tool.execute({
      files: ['test.txt'],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'error',
      file_path: 'test.txt',
      error_message: 'Execution error: Sandbox execution failed: Command not found',
    });
  });

  it('should handle file not found in sandbox', async () => {
    const { runTypescript } = await import('@buster/sandbox');
    const mockRunTypescript = vi.mocked(runTypescript);

    // Mock sandbox execution with file not found
    mockRunTypescript.mockResolvedValue({
      exitCode: 0,
      result: JSON.stringify([
        {
          success: false,
          filePath: 'nonexistent.txt',
          error: 'File not found',
        },
      ]),
      stderr: '',
    });

    const tool = createReadFilesTool(context);

    const result = await tool.execute({
      files: ['nonexistent.txt'],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'error',
      file_path: 'nonexistent.txt',
      error_message: 'File not found',
    });
  });

  it('should handle truncated files', async () => {
    const { runTypescript } = await import('@buster/sandbox');
    const mockRunTypescript = vi.mocked(runTypescript);

    // Mock sandbox execution with truncated file
    mockRunTypescript.mockResolvedValue({
      exitCode: 0,
      result: JSON.stringify([
        {
          success: true,
          filePath: 'large.txt',
          content: 'Line 1\nLine 2\n...\nLine 1000',
          truncated: true,
        },
      ]),
      stderr: '',
    });

    const tool = createReadFilesTool(context);

    const result = await tool.execute({
      files: ['large.txt'],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toEqual({
      status: 'success',
      file_path: 'large.txt',
      content: 'Line 1\nLine 2\n...\nLine 1000',
      truncated: true,
    });
  });

  it('should handle JSON parsing errors', async () => {
    const { runTypescript } = await import('@buster/sandbox');
    const mockRunTypescript = vi.mocked(runTypescript);

    // Mock sandbox execution with invalid JSON
    mockRunTypescript.mockResolvedValue({
      exitCode: 0,
      result: 'invalid json output',
      stderr: '',
    });

    const tool = createReadFilesTool(context);

    const result = await tool.execute({
      files: ['test.txt'],
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].status).toBe('error');
    expect(result.results[0].error_message).toContain('Failed to parse sandbox output');
  });

  it('should handle multiple files with mixed results', async () => {
    const { runTypescript } = await import('@buster/sandbox');
    const mockRunTypescript = vi.mocked(runTypescript);

    // Mock sandbox execution with mixed results
    mockRunTypescript.mockResolvedValue({
      exitCode: 0,
      result: JSON.stringify([
        {
          success: true,
          filePath: 'existing.txt',
          content: 'File content',
          truncated: false,
        },
        {
          success: false,
          filePath: 'missing.txt',
          error: 'File not found',
        },
      ]),
      stderr: '',
    });

    const tool = createReadFilesTool(context);

    const result = await tool.execute({
      files: ['existing.txt', 'missing.txt'],
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0]).toEqual({
      status: 'success',
      file_path: 'existing.txt',
      content: 'File content',
      truncated: false,
    });
    expect(result.results[1]).toEqual({
      status: 'error',
      file_path: 'missing.txt',
      error_message: 'File not found',
    });
  });
});
