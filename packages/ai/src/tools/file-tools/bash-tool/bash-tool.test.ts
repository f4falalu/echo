import { materialize } from '@buster/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBashTool } from './bash-tool';

// Mock the dependencies
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

describe('createBashTool', () => {
  const mockSandbox = {
    id: 'test-sandbox',
    process: {
      executeCommand: vi.fn(),
    },
  } as any;

  const mockContext = {
    messageId: 'test-message-id',
    sandbox: mockSandbox,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a bash tool with proper configuration', () => {
    const bashTool = createBashTool(mockContext);

    expect(bashTool).toBeDefined();
    expect(bashTool.description).toContain('Executes bash commands');
    expect(bashTool.inputSchema).toBeDefined();
    expect(bashTool.outputSchema).toBeDefined();
    expect(bashTool.execute).toBeDefined();
  });

  it('should handle successful command execution', async () => {
    mockSandbox.process.executeCommand.mockResolvedValue({
      result: 'Hello World',
      exitCode: 0,
    });

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        commands: [
          {
            command: 'echo "Hello World"',
            description: 'Test echo command',
          },
        ],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      command: 'echo "Hello World"',
      stdout: 'Hello World',
      exitCode: 0,
      success: true,
    });
  });

  it('should handle command failures', async () => {
    mockSandbox.process.executeCommand.mockResolvedValue({
      result: 'command not found',
      exitCode: 127,
    });

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        commands: [
          {
            command: 'nonexistentcommand',
            description: 'Test failing command',
          },
        ],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      command: 'nonexistentcommand',
      stdout: 'command not found',
      exitCode: 127,
      success: false,
      error: 'command not found',
    });
  });

  it('should handle multiple commands', async () => {
    mockSandbox.process.executeCommand
      .mockResolvedValueOnce({
        result: '/tmp/test',
        exitCode: 0,
      })
      .mockResolvedValueOnce({
        result: 'Hello from test',
        exitCode: 0,
      });

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        commands: [
          {
            command: 'pwd',
            description: 'Print working directory',
          },
          {
            command: 'echo "Hello from test"',
            description: 'Echo test message',
          },
        ],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.results).toHaveLength(2);
    expect(result.results[0]?.success).toBe(true);
    expect(result.results[1]?.success).toBe(true);
    expect(mockSandbox.process.executeCommand).toHaveBeenCalledTimes(2);
  });

  it('should handle sandbox execution errors', async () => {
    mockSandbox.process.executeCommand.mockRejectedValue(new Error('Sandbox error'));

    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        commands: [
          {
            command: 'echo "test"',
            description: 'Test command',
          },
        ],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      command: 'echo "test"',
      success: false,
      error: 'Execution error: Sandbox error',
    });
  });

  it('should handle empty commands array', async () => {
    const bashTool = createBashTool(mockContext);

    const rawResult = await bashTool.execute!(
      {
        commands: [],
      },
      { toolCallId: 'test-tool-call', messages: [], abortSignal: new AbortController().signal }
    );
    const result = await materialize(rawResult);

    expect(result.results).toHaveLength(0);
    expect(mockSandbox.process.executeCommand).not.toHaveBeenCalled();
  });
});
