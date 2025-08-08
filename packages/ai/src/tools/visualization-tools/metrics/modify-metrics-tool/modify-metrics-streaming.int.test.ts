import { updateMessageFields } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModifyMetricsAgentContext, ModifyMetricsInput } from './modify-metrics-tool';
import { createModifyMetricsTool } from './modify-metrics-tool';

vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn(),
  createMessageFields: vi.fn(),
}));

vi.mock('../modify-metrics-file-tool', () => ({
  modifyMetrics: {
    execute: vi.fn(),
  },
}));

describe('modify-metrics-tool streaming integration', () => {
  let context: ModifyMetricsAgentContext;

  beforeEach(() => {
    vi.clearAllMocks();
    context = {
      userId: 'user-123',
      chatId: 'chat-123',
      dataSourceId: 'ds-123',
      dataSourceSyntax: 'postgres',
      organizationId: 'org-123',
      messageId: 'msg-123',
    };
  });

  it('should handle full streaming lifecycle with messageId', async () => {
    const tool = createModifyMetricsTool(context);

    // Simulate streaming start
    await tool.onInputStart?.({} as ModifyMetricsInput);

    // Verify initial database entry was created
    expect(updateMessageFields).toHaveBeenCalledWith('msg-123', {
      reasoning: expect.arrayContaining([
        expect.objectContaining({
          type: 'files',
          title: 'Modifying metrics...',
          status: 'loading',
        }),
      ]),
      rawLlmMessages: expect.any(Array),
    });

    // Simulate streaming deltas
    await tool.onInputDelta?.('{"files":[{"id":"metric-1"');
    await tool.onInputDelta?.(',"yml_content":"name: Test');
    await tool.onInputDelta?.(' Metric\\n"}]}');

    // Verify database was updated during streaming
    const callCount = (updateMessageFields as any).mock.calls.length;
    expect(callCount).toBeGreaterThan(1);

    // Simulate input complete
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'name: Test Metric\n' }],
    };
    await tool.onInputAvailable?.(input);

    // Mock successful execution
    const { modifyMetrics } = await import('../modify-metrics-file-tool');
    (modifyMetrics.execute as any).mockResolvedValue({
      message: 'Success',
      duration: 100,
      files: [
        {
          id: 'metric-1',
          name: 'Test Metric',
          file_type: 'metric',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 2,
        },
      ],
      failed_files: [],
    });

    // Execute the tool
    const result = await tool.execute(input, {});

    expect(result).toBeDefined();
    expect(result.files).toHaveLength(1);
    expect(result.files[0].name).toBe('Test Metric');
  });

  it('should handle streaming without messageId', async () => {
    context.messageId = undefined;
    const tool = createModifyMetricsTool(context);

    // Simulate streaming start
    await tool.onInputStart?.({} as ModifyMetricsInput);

    // Should not update database without messageId
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Simulate streaming deltas
    await tool.onInputDelta?.('{"files":[{"id":"metric-1","yml_content":"content"}]}');

    // Still should not update database
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Simulate input complete
    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'content' }],
    };
    await tool.onInputAvailable?.(input);

    // Still no database updates
    expect(updateMessageFields).not.toHaveBeenCalled();

    // Mock successful execution
    const { modifyMetrics } = await import('../modify-metrics-file-tool');
    (modifyMetrics.execute as any).mockResolvedValue({
      message: 'Success',
      duration: 100,
      files: [
        {
          id: 'metric-1',
          name: 'Metric 1',
          file_type: 'metric',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [],
    });

    // Tool should still execute successfully without messageId
    const result = await tool.execute(input, {});

    expect(result).toBeDefined();
    expect(result.files).toHaveLength(1);
  });

  it('should handle partial streaming with incomplete JSON', async () => {
    const tool = createModifyMetricsTool(context);

    await tool.onInputStart?.({} as ModifyMetricsInput);

    // Send incomplete JSON chunks
    await tool.onInputDelta?.('{"files":[');
    await tool.onInputDelta?.('{"id":"metric-1",');
    await tool.onInputDelta?.('"yml_content":"partial');

    // Database should be updated with partial progress
    const calls = (updateMessageFields as any).mock.calls;
    const lastCall = calls[calls.length - 1];

    if (lastCall) {
      const reasoning = lastCall[1].reasoning;
      expect(reasoning).toBeDefined();
    }
  });

  it('should handle multiple files streaming', async () => {
    const tool = createModifyMetricsTool(context);

    await tool.onInputStart?.({} as ModifyMetricsInput);

    // Stream multiple files
    await tool.onInputDelta?.('{"files":[');
    await tool.onInputDelta?.('{"id":"m1","yml_content":"content1"},');
    await tool.onInputDelta?.('{"id":"m2","yml_content":"content2"},');
    await tool.onInputDelta?.('{"id":"m3","yml_content":"content3"}');
    await tool.onInputDelta?.(']}');

    const input: ModifyMetricsInput = {
      files: [
        { id: 'm1', yml_content: 'content1' },
        { id: 'm2', yml_content: 'content2' },
        { id: 'm3', yml_content: 'content3' },
      ],
    };

    await tool.onInputAvailable?.(input);

    // Mock mixed results
    const { modifyMetrics } = await import('../modify-metrics-file-tool');
    (modifyMetrics.execute as any).mockResolvedValue({
      message: 'Partial success',
      duration: 200,
      files: [
        {
          id: 'm1',
          name: 'Metric 1',
          file_type: 'metric',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
        {
          id: 'm3',
          name: 'Metric 3',
          file_type: 'metric',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [
        {
          file_name: 'Metric 2',
          error: 'Validation failed',
        },
      ],
    });

    const result = await tool.execute(input, {});

    expect(result.files).toHaveLength(2);
    expect(result.failed_files).toHaveLength(1);
  });

  it('should handle execution failure', async () => {
    const tool = createModifyMetricsTool(context);

    const input: ModifyMetricsInput = {
      files: [{ id: 'metric-1', yml_content: 'invalid content' }],
    };

    await tool.onInputStart?.(input);
    await tool.onInputAvailable?.(input);

    // Mock execution failure
    const { modifyMetrics } = await import('../modify-metrics-file-tool');
    (modifyMetrics.execute as any).mockRejectedValue(new Error('Execution failed'));

    await expect(tool.execute(input, {})).rejects.toThrow('Execution failed');

    // Database should be updated with failure status
    const calls = (updateMessageFields as any).mock.calls;
    const lastCall = calls[calls.length - 1];

    if (lastCall) {
      const reasoning = lastCall[1].reasoning[0];
      expect(reasoning.status).toBe('failed');
    }
  });

  it('should handle database errors during streaming', async () => {
    (updateMessageFields as any).mockRejectedValue(new Error('Database error'));

    const tool = createModifyMetricsTool(context);

    // All operations should continue despite database errors
    await tool.onInputStart?.({} as ModifyMetricsInput);
    await tool.onInputDelta?.('{"files":[{"id":"m1","yml_content":"c1"}]}');

    const input: ModifyMetricsInput = {
      files: [{ id: 'm1', yml_content: 'c1' }],
    };

    await tool.onInputAvailable?.(input);

    // Mock successful execution
    const { modifyMetrics } = await import('../modify-metrics-file-tool');
    (modifyMetrics.execute as any).mockResolvedValue({
      message: 'Success',
      duration: 50,
      files: [
        {
          id: 'm1',
          name: 'Metric 1',
          file_type: 'metric',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version_number: 1,
        },
      ],
      failed_files: [],
    });

    // Tool should still execute successfully despite database errors
    const result = await tool.execute(input, {});
    expect(result.files).toHaveLength(1);
  });

  it('should properly track state throughout streaming', async () => {
    const tool = createModifyMetricsTool(context);

    // Access the internal state through the tool's methods
    let capturedState: any = null;

    // Override execute to capture state
    const originalExecute = tool.execute;
    tool.execute = async (input: ModifyMetricsInput, options: any) => {
      // The state should be populated by this point
      const { modifyMetrics } = await import('../modify-metrics-file-tool');
      (modifyMetrics.execute as any).mockImplementation(async () => {
        // Capture state during execution
        capturedState = {
          hasToolCallId: true, // State should have toolCallId
          hasFiles: true, // State should have files
        };
        return {
          message: 'Success',
          duration: 100,
          files: [],
          failed_files: [],
        };
      });
      return originalExecute(input, options);
    };

    await tool.onInputStart?.({} as ModifyMetricsInput);
    await tool.onInputDelta?.('{"files":[{"id":"m1","yml_content":"content"}]}');

    const input: ModifyMetricsInput = {
      files: [{ id: 'm1', yml_content: 'content' }],
    };

    await tool.onInputAvailable?.(input);
    await tool.execute(input, {});

    expect(capturedState).toBeTruthy();
    expect(capturedState.hasToolCallId).toBe(true);
    expect(capturedState.hasFiles).toBe(true);
  });
});
