import type { Sandbox } from '@buster/sandbox';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OptimisticJsonParser } from '../../../utils/streaming/optimistic-json-parser';
import { type ReadFilesToolContext, createReadFilesTool } from './read-files-tool';

// Mock the database module
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn().mockResolvedValue(undefined),
}));

// Mock braintrust
vi.mock('braintrust', () => ({
  wrapTraced: vi.fn().mockImplementation((fn: any) => fn),
}));

// Mock sandbox
vi.mock('@buster/sandbox', () => ({
  runTypescript: vi.fn(),
}));

// Mock crypto module
vi.mock('node:crypto', () => ({
  randomUUID: vi.fn(() => 'mock-uuid-12345'),
}));

describe('read-files-tool streaming', () => {
  let mockSandbox: Partial<Sandbox>;
  let context: ReadFilesToolContext;
  let mockUpdateMessageEntries: any;

  beforeEach(async () => {
    mockSandbox = {
      id: 'test-sandbox-id',
      fs: {} as any,
    };

    context = {
      messageId: 'test-message-id',
      sandbox: mockSandbox as Sandbox,
    };

    const { updateMessageEntries } = await import('@buster/database');
    mockUpdateMessageEntries = vi.mocked(updateMessageEntries);

    vi.clearAllMocks();
  });

  it('should handle streaming input start', async () => {
    const tool = createReadFilesTool(context);

    await tool.onInputStart();

    expect(mockUpdateMessageEntries).toHaveBeenCalledWith({
      messageId: 'test-message-id',
      entries: [
        {
          entry_id: 'mock-uuid-12345',
          type: 'tool_execution',
          tool_name: 'read_files',
          args: '{}',
          result: null,
          status: 'loading',
          started_at: expect.any(Date),
          completed_at: undefined,
        },
      ],
    });
  });

  it('should handle streaming input delta with files array', async () => {
    const tool = createReadFilesTool(context);

    // Start the streaming process
    await tool.onInputStart();
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);

    // Send partial JSON with files array
    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: '{"files": ["test.txt", "another.txt"]',
      },
    });

    // Should have called update again with parsed files
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);
    expect(mockUpdateMessageEntries).toHaveBeenLastCalledWith({
      messageId: 'test-message-id',
      entries: [
        {
          entry_id: 'mock-uuid-12345',
          type: 'tool_execution',
          tool_name: 'read_files',
          args: JSON.stringify({
            files: ['test.txt', 'another.txt'],
          }),
          result: null,
          status: 'loading',
          started_at: expect.any(Date),
          completed_at: undefined,
        },
      ],
    });
  });

  it('should handle streaming input delta incrementally', async () => {
    const tool = createReadFilesTool(context);

    // Start the streaming process
    await tool.onInputStart();

    // Send JSON piece by piece
    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: '{"files"',
      },
    });

    // Should not update yet (not enough info)
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);

    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: ': ["file1.txt"',
      },
    });

    // Now should have enough to parse
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);

    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: ', "file2.txt"]',
      },
    });

    // Should not update again since files already parsed
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);

    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: '}',
      },
    });

    // Still should not update
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);
  });

  it('should handle onInputAvailable with complete input', async () => {
    const tool = createReadFilesTool(context);

    // First start the streaming process
    await tool.onInputStart();

    const completeInput = {
      files: ['complete1.txt', 'complete2.txt'],
    };

    await tool.onInputAvailable({ input: completeInput });

    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);
    expect(mockUpdateMessageEntries).toHaveBeenLastCalledWith({
      messageId: 'test-message-id',
      entries: [
        {
          entry_id: 'mock-uuid-12345',
          type: 'tool_execution',
          tool_name: 'read_files',
          args: JSON.stringify(completeInput),
          result: null,
          status: 'loading',
          started_at: expect.any(Date),
          completed_at: undefined,
        },
      ],
    });
  });

  it('should handle errors in streaming handlers gracefully', async () => {
    const tool = createReadFilesTool(context);

    // Mock database failure
    mockUpdateMessageEntries.mockRejectedValue(new Error('Database error'));

    // Should not throw
    await expect(tool.onInputStart()).resolves.toBeUndefined();
    await expect(
      tool.onInputDelta({
        delta: {
          type: 'text-delta',
          textDelta: '{"files": ["test.txt"]}',
        },
      })
    ).resolves.toBeUndefined();
    await expect(
      tool.onInputAvailable({ input: { files: ['test.txt'] } })
    ).resolves.toBeUndefined();
  });

  it('should ignore non-text-delta types in onInputDelta', async () => {
    const tool = createReadFilesTool(context);

    await tool.onInputStart();
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);

    await tool.onInputDelta({
      delta: {
        type: 'other-type' as any,
        textDelta: '{"files": ["test.txt"]}',
      },
    });

    // Should not have updated again
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);
  });

  it('should handle empty or invalid streaming data', async () => {
    const tool = createReadFilesTool(context);

    await tool.onInputStart();

    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: '',
      },
    });

    // Should not fail and not trigger extra updates
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);

    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: 'invalid json',
      },
    });

    // Should still not fail
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(1);
  });

  it('should work with OptimisticJsonParser for incomplete JSON', async () => {
    // Test the parser directly
    const incompleteJson = '{"files": ["test.txt", "another.txt"';
    const result = OptimisticJsonParser.parse(incompleteJson);

    expect(result.extractedValues.get('files')).toEqual(['test.txt', 'another.txt']);
  });

  it('should handle streaming with multiple file updates', async () => {
    const tool = createReadFilesTool(context);

    await tool.onInputStart();

    // First partial update
    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: '{"files": ["first.txt"]',
      },
    });

    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);

    // Complete the array with more files
    await tool.onInputDelta({
      delta: {
        type: 'text-delta',
        textDelta: ', "second.txt"]}',
      },
    });

    // Should not update again since files already parsed the first time
    expect(mockUpdateMessageEntries).toHaveBeenCalledTimes(2);

    // Verify the last call had the correct files
    const lastCall = mockUpdateMessageEntries.mock.calls[1];
    const parsedArgs = JSON.parse(lastCall[0].entries[0].args);
    expect(parsedArgs.files).toEqual(['first.txt']);
  });
});
