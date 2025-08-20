import { InvalidToolInputError, NoSuchToolError } from 'ai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYST_AGENT_NAME } from '../../agents';
import type { RepairContext } from './types';

vi.mock('braintrust', () => ({
  wrapTraced: (fn: any) => fn,
}));

describe('repairToolCall', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should use StructuredOutputStrategy for InvalidToolInputError', async () => {
    // Mock the strategies for this test
    vi.doMock('./strategies', () => ({
      StructuredOutputStrategy: vi.fn().mockImplementation(() => ({
        canHandle: (error: Error) => error instanceof InvalidToolInputError,
        repair: vi.fn().mockResolvedValue({
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          args: { fixed: true },
        }),
      })),
      ReAskStrategy: vi.fn().mockImplementation(() => ({
        canHandle: () => false,
        repair: vi.fn(),
      })),
    }));

    const { repairToolCall } = await import('./repair-tool-call');
    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
        args: { invalid: true },
      } as any,
      tools: {
        testTool: { inputSchema: {} },
      } as any,
      error: new InvalidToolInputError({
        toolName: 'testTool',
        toolInput: 'invalid',
        cause: new Error('validation failed'),
      }),
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);

    expect(result).toEqual({
      toolCallType: 'function',
      toolCallId: 'call123',
      toolName: 'testTool',
      args: { fixed: true },
    });
  });

  it('should use ReAskStrategy for NoSuchToolError', async () => {
    // Mock the strategies for this test
    vi.doMock('./strategies', () => ({
      StructuredOutputStrategy: vi.fn().mockImplementation(() => ({
        canHandle: () => false,
        repair: vi.fn(),
      })),
      ReAskStrategy: vi.fn().mockImplementation(() => ({
        canHandle: (error: Error) => NoSuchToolError.isInstance(error),
        repair: vi.fn().mockResolvedValue({
          toolCallType: 'function',
          toolCallId: 'call456',
          toolName: 'correctTool',
          input: '{}',
        }),
      })),
    }));

    const { repairToolCall } = await import('./repair-tool-call');
    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call456',
        toolName: 'wrongTool',
        input: '{}',
      } as any,
      tools: {
        correctTool: { inputSchema: {} },
      } as any,
      error: new NoSuchToolError({
        toolName: 'wrongTool',
        availableTools: ['correctTool'],
      }),
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);

    expect(result).toEqual({
      toolCallType: 'function',
      toolCallId: 'call456',
      toolName: 'correctTool',
      input: '{}',
    });
  });

  it('should return null for unknown error types', async () => {
    vi.doMock('./strategies', () => ({
      StructuredOutputStrategy: vi.fn().mockImplementation(() => ({
        canHandle: () => false,
        repair: vi.fn(),
      })),
      ReAskStrategy: vi.fn().mockImplementation(() => ({
        canHandle: () => false,
        repair: vi.fn(),
      })),
    }));

    const { repairToolCall } = await import('./repair-tool-call');
    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call789',
        toolName: 'someTool',
      } as any,
      tools: {} as any,
      error: new Error('Unknown error type') as any,
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);
    expect(result).toBeNull();
  });

  it('should handle strategy repair failures gracefully', async () => {
    // Mock a failing strategy
    vi.doMock('./strategies', () => ({
      StructuredOutputStrategy: vi.fn().mockImplementation(() => ({
        canHandle: (error: Error) => error instanceof InvalidToolInputError,
        repair: vi.fn().mockRejectedValue(new Error('Repair failed')),
      })),
      ReAskStrategy: vi.fn().mockImplementation(() => ({
        canHandle: () => false,
        repair: vi.fn(),
      })),
    }));

    const { repairToolCall } = await import('./repair-tool-call');

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call999',
        toolName: 'testTool',
      } as any,
      tools: {} as any,
      error: new InvalidToolInputError({
        toolName: 'testTool',
        toolInput: 'invalid',
        cause: new Error('validation failed'),
      }),
      messages: [],
      system: '',
    };

    const result = await repairToolCall(context);
    expect(result).toBeNull();
  });

  it('should log appropriate messages with agent context', async () => {
    const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

    // Mock successful repair
    vi.doMock('./strategies', () => ({
      StructuredOutputStrategy: vi.fn().mockImplementation(() => ({
        canHandle: (error: Error) => error instanceof InvalidToolInputError,
        repair: vi.fn().mockResolvedValue({
          toolCallType: 'function',
          toolCallId: 'call123',
          toolName: 'testTool',
          args: { fixed: true },
        }),
      })),
      ReAskStrategy: vi.fn().mockImplementation(() => ({
        canHandle: () => false,
        repair: vi.fn(),
      })),
    }));

    const { repairToolCall } = await import('./repair-tool-call');

    const context: RepairContext = {
      toolCall: {
        toolCallType: 'function',
        toolCallId: 'call123',
        toolName: 'testTool',
      } as any,
      tools: {
        testTool: { inputSchema: {} },
      } as any,
      error: new InvalidToolInputError({
        toolName: 'testTool',
        toolInput: 'invalid',
        cause: new Error('validation failed'),
      }),
      messages: [],
      system: '',
      agentContext: {
        agentName: ANALYST_AGENT_NAME,
        availableTools: ['createMetrics', 'modifyMetrics'],
      },
    };

    await repairToolCall(context);

    // Check that "Attempting to repair" was called first
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      1,
      'Attempting to repair tool call',
      expect.objectContaining({
        agentName: 'analystAgent',
      })
    );

    // Check that "Tool call repaired successfully" was called second
    expect(consoleInfoSpy).toHaveBeenNthCalledWith(
      2,
      'Tool call repaired successfully',
      expect.objectContaining({
        agentName: 'analystAgent',
      })
    );

    consoleInfoSpy.mockRestore();
  });
});
