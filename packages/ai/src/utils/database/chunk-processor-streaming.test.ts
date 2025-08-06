import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from './chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('ChunkProcessor - Streaming', () => {
  const mockMessageId = 'test-message-id';

  describe('Duplicate Message Prevention', () => {
    it('should prevent duplicate reasoning entries during streaming', async () => {
      const availableTools = new Set(['sequentialThinking']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Simulate duplicate chunks (can happen in streaming)
      const thoughtChunk = {
        type: 'tool-call',
        toolCallId: 'think-1',
        toolName: 'sequentialThinking',
        args: {
          thought: 'Analyzing the problem',
          thoughtNumber: 1,
          totalThoughts: 3,
          nextThoughtNeeded: true,
        },
      } as TextStreamPart<ToolSet>;

      // Process the same chunk multiple times
      await processor.processChunk(thoughtChunk);
      await processor.processChunk(thoughtChunk);
      await processor.processChunk(thoughtChunk);

      const reasoning = processor.getReasoningHistory();
      // Should only have one entry despite multiple chunks
      expect(reasoning).toHaveLength(1);
      expect(reasoning[0]).toMatchObject({
        type: 'text',
        message: 'Analyzing the problem',
      });
    });

    it('should handle interleaved tool calls and results', async () => {
      const availableTools = new Set(['execute-sql', 'sequentialThinking']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // First tool call
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-1',
        toolName: 'execute-sql',
        args: { sql: 'SELECT COUNT(*) FROM users' },
      } as TextStreamPart<ToolSet>);

      // Second tool call before first result
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'think-1',
        toolName: 'sequentialThinking',
        args: {
          thought: 'Processing query results',
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false,
        },
      } as TextStreamPart<ToolSet>);

      // First tool result
      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'sql-1',
        toolName: 'execute-sql',
        result: { columns: ['count'], rows: [['100']] },
      } as TextStreamPart<ToolSet>);

      // Second tool result
      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'think-1',
        toolName: 'sequentialThinking',
        result: {
          thought: 'Processing query results',
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false,
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning).toHaveLength(2);
      expect(reasoning[0].type).toBe('sql');
      expect(reasoning[1].type).toBe('text');
    });
  });

  describe('File ID Mapping', () => {
    it('should map dummy file IDs to actual IDs from tool results', async () => {
      const availableTools = new Set(['create-metrics-file']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Tool call with dummy IDs
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'metrics-1',
        toolName: 'create-metrics-file',
        args: {
          metrics: [{ id: 'dummy-1', name: 'Revenue' }],
        },
      } as TextStreamPart<ToolSet>);

      // Tool result with actual file IDs
      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'metrics-1',
        toolName: 'create-metrics-file',
        result: {
          files: [{ id: 'actual-file-1', name: 'metrics.json' }],
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      const fileEntry = reasoning.find((r) => r.type === 'files');

      expect(fileEntry).toBeDefined();
      expect(fileEntry?.file_ids).toContain('actual-file-1');
    });

    it('should handle multiple file creation tools', async () => {
      const availableTools = new Set(['create-metrics-file', 'create-dashboards-file']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Create metrics
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'metrics-1',
        toolName: 'create-metrics-file',
        args: { metrics: [] },
      } as TextStreamPart<ToolSet>);

      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'metrics-1',
        toolName: 'create-metrics-file',
        result: {
          files: [{ id: 'metrics-file-1' }],
        },
      } as TextStreamPart<ToolSet>);

      // Create dashboards
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'dash-1',
        toolName: 'create-dashboards-file',
        args: { dashboards: [] },
      } as TextStreamPart<ToolSet>);

      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'dash-1',
        toolName: 'create-dashboards-file',
        result: {
          files: [{ id: 'dashboard-file-1' }],
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      const fileEntries = reasoning.filter((r) => r.type === 'files');

      expect(fileEntries).toHaveLength(2);
      expect(fileEntries[0].file_ids).toContain('metrics-file-1');
      expect(fileEntries[1].file_ids).toContain('dashboard-file-1');
    });
  });

  describe('SQL Query Processing', () => {
    it('should handle legacy SQL formats', async () => {
      const availableTools = new Set(['execute-sql']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Legacy format with queries array
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-legacy-1',
        toolName: 'execute-sql',
        args: {
          queries: ['SELECT * FROM users', 'SELECT * FROM products'],
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning[0]).toMatchObject({
        type: 'sql',
        sql: 'SELECT * FROM users',
      });
    });

    it('should extract SQL from different result formats', async () => {
      const availableTools = new Set(['execute-sql']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-1',
        toolName: 'execute-sql',
        args: {
          sql: 'SELECT id, name FROM users LIMIT 5',
        },
      } as TextStreamPart<ToolSet>);

      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'sql-1',
        toolName: 'execute-sql',
        result: {
          columns: ['id', 'name'],
          rows: [
            ['1', 'Alice'],
            ['2', 'Bob'],
          ],
          query: 'SELECT id, name FROM users LIMIT 5',
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning[0]).toMatchObject({
        type: 'sql',
        status: 'completed',
        sql: 'SELECT id, name FROM users LIMIT 5',
      });
    });
  });

  describe('Message Accumulation', () => {
    it('should accumulate messages during streaming', async () => {
      const availableTools = new Set(['doneTool']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Add initial messages
      const initialMessages: CoreMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      processor.setInitialMessages(initialMessages);

      // Add new assistant message
      await processor.processChunk({
        type: 'text-delta',
        textDelta: 'How can I help you today?',
      } as TextStreamPart<ToolSet>);

      // Finish streaming
      await processor.processChunk({
        type: 'finish',
      } as TextStreamPart<ToolSet>);

      const messages = processor.getAccumulatedMessages();
      expect(messages).toHaveLength(3);
      expect(messages[2]).toMatchObject({
        role: 'assistant',
        content: 'How can I help you today?',
      });
    });
  });
});
