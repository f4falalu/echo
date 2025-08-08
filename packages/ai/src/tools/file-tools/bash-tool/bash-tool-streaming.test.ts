import { describe, expect, it, vi } from 'vitest';
import { createBashTool } from './bash-tool';

// Mock the dependencies
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

vi.mock('braintrust', () => ({
  wrapTraced: vi.fn((fn) => fn),
}));

vi.mock('../../../utils/streaming/optimistic-json-parser', () => ({
  OptimisticJsonParser: {
    parse: vi.fn(),
  },
  getOptimisticValue: vi.fn(),
}));

describe('bash-tool streaming functionality', () => {
  const mockSandbox = {
    id: 'test-sandbox',
    process: {
      executeCommand: vi.fn(),
    },
  };

  const mockContext = {
    messageId: 'test-message-id',
    sandbox: mockSandbox,
  };

  it('should handle onInputStart correctly', async () => {
    const bashTool = createBashTool(mockContext);

    await expect(
      bashTool.onInputStart!({
        toolCallId: 'test-tool-call-id',
      })
    ).resolves.toBeUndefined();
  });

  it('should handle onInputDelta correctly', async () => {
    const { OptimisticJsonParser, getOptimisticValue } = await import(
      '../../../utils/streaming/optimistic-json-parser'
    );

    // Mock the optimistic parser to return commands
    (OptimisticJsonParser.parse as any).mockReturnValue({
      extractedValues: {
        commands: [
          {
            command: 'echo "test"',
            description: 'Test command',
          },
        ],
      },
    });

    (getOptimisticValue as any).mockReturnValue([
      {
        command: 'echo "test"',
        description: 'Test command',
      },
    ]);

    const bashTool = createBashTool(mockContext);

    await expect(
      bashTool.onInputDelta!({
        toolCallId: 'test-tool-call-id',
        inputTextDelta: '{"commands": [{"command": "echo \\"test\\""}]}',
      })
    ).resolves.toBeUndefined();

    expect(OptimisticJsonParser.parse).toHaveBeenCalledWith(
      '{"commands": [{"command": "echo \\"test\\""}]}'
    );
  });

  it('should handle onInputAvailable correctly', async () => {
    const bashTool = createBashTool(mockContext);

    const input = {
      commands: [
        {
          command: 'echo "Hello World"',
          description: 'Test echo command',
        },
      ],
    };

    await expect(
      bashTool.onInputAvailable!(input, {
        toolCallId: 'test-tool-call-id',
      })
    ).resolves.toBeUndefined();
  });

  it('should handle incremental JSON parsing in delta', async () => {
    const { OptimisticJsonParser, getOptimisticValue } = await import(
      '../../../utils/streaming/optimistic-json-parser'
    );

    // Mock the optimistic parser for incomplete JSON
    (OptimisticJsonParser.parse as any).mockReturnValue({
      extractedValues: {
        commands: [
          {
            command: 'pwd',
          },
        ],
      },
    });

    (getOptimisticValue as any).mockReturnValue([
      {
        command: 'pwd',
      },
    ]);

    const bashTool = createBashTool(mockContext);

    // Simulate streaming incomplete JSON
    await bashTool.onInputDelta!({
      toolCallId: 'test-tool-call-id',
      inputTextDelta: '{"commands": [{"command": "pwd"',
    });

    expect(OptimisticJsonParser.parse).toHaveBeenCalledWith('{"commands": [{"command": "pwd"');
  });

  it('should filter invalid commands in delta parsing', async () => {
    const { OptimisticJsonParser, getOptimisticValue } = await import(
      '../../../utils/streaming/optimistic-json-parser'
    );

    // Mock the optimistic parser to return mixed valid and invalid commands
    (OptimisticJsonParser.parse as any).mockReturnValue({
      extractedValues: {
        commands: [
          {
            command: 'echo "valid"',
            description: 'Valid command',
          },
          {
            // Missing command field - should be filtered out
            description: 'Invalid command',
          },
          'invalid string command', // Not an object - should be filtered out
        ],
      },
    });

    (getOptimisticValue as any).mockReturnValue([
      {
        command: 'echo "valid"',
        description: 'Valid command',
      },
      {
        description: 'Invalid command', // Missing command field
      },
      'invalid string command',
    ]);

    const bashTool = createBashTool(mockContext);

    await bashTool.onInputDelta!({
      toolCallId: 'test-tool-call-id',
      inputTextDelta:
        '{"commands": [{"command": "echo \\"valid\\""}, {"description": "invalid"}, "string"]}',
    });

    expect(getOptimisticValue).toHaveBeenCalledWith(expect.any(Object), 'commands', []);
  });
});
