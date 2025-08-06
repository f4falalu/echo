import type { CoreMessage, TextStreamPart, ToolSet } from 'ai';
import { describe, expect, it, vi } from 'vitest';
import { ChunkProcessor } from './chunk-processor';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageFields: vi.fn().mockResolvedValue(undefined),
}));

describe('ChunkProcessor - Error Handling', () => {
  const mockMessageId = 'test-message-id';

  describe('File Creation Failures', () => {
    it('should handle file creation failures in metrics', async () => {
      const availableTools = new Set(['create-metrics-file']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Process a failed metrics creation
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'metrics-call-1',
        toolName: 'create-metrics-file',
        args: {
          metrics: [],
        },
      } as TextStreamPart<ToolSet>);

      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'metrics-call-1',
        toolName: 'create-metrics-file',
        result: {
          error: 'Failed to create metrics file',
          files: [],
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      const metricsEntry = reasoning.find((r) => r.type === 'files');

      expect(metricsEntry).toMatchObject({
        type: 'files',
        status: 'failed',
        error: 'Failed to create metrics file',
      });
    });

    it('should handle file creation failures in dashboards', async () => {
      const availableTools = new Set(['create-dashboards-file']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Process a failed dashboard creation
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'dashboard-call-1',
        toolName: 'create-dashboards-file',
        args: {
          dashboards: [],
        },
      } as TextStreamPart<ToolSet>);

      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'dashboard-call-1',
        toolName: 'create-dashboards-file',
        result: {
          error: 'Failed to create dashboard file',
          files: [],
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      const dashboardEntry = reasoning.find((r) => r.type === 'files');

      expect(dashboardEntry).toMatchObject({
        type: 'files',
        status: 'failed',
        error: 'Failed to create dashboard file',
      });
    });
  });

  describe('Tool Call Failures', () => {
    it('should handle failed tool calls with error results', async () => {
      const availableTools = new Set(['execute-sql']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-call-1',
        toolName: 'execute-sql',
        args: {
          sql: 'SELECT * FROM users',
        },
      } as TextStreamPart<ToolSet>);

      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'sql-call-1',
        toolName: 'execute-sql',
        result: {
          error: 'Database connection failed',
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning).toHaveLength(1);
      expect(reasoning[0]).toMatchObject({
        type: 'sql',
        status: 'failed',
        error: 'Database connection failed',
      });
    });

    it('should handle malformed tool results gracefully', async () => {
      const availableTools = new Set(['sequentialThinking']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'think-1',
        toolName: 'sequentialThinking',
        args: {
          thought: 'Processing',
        },
      } as TextStreamPart<ToolSet>);

      // Malformed result (missing expected fields)
      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'think-1',
        toolName: 'sequentialThinking',
        result: null,
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning).toHaveLength(1);
      // Should still have the entry, even if result was malformed
      expect(reasoning[0]).toMatchObject({
        type: 'text',
      });
    });
  });

  describe('Deferred Response Handling', () => {
    it('should handle deferred responses during tool execution', async () => {
      const availableTools = new Set(['execute-sql']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      // Start SQL execution
      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-1',
        toolName: 'execute-sql',
        args: {
          sql: 'SELECT * FROM large_table',
        },
      } as TextStreamPart<ToolSet>);

      // Mark as in-progress
      const reasoning = processor.getReasoningHistory();
      expect(reasoning[0]).toMatchObject({
        type: 'sql',
        status: 'in-progress',
      });

      // Complete with result
      await processor.processChunk({
        type: 'tool-result',
        toolCallId: 'sql-1',
        toolName: 'execute-sql',
        result: {
          columns: ['id', 'name'],
          rows: [['1', 'Test']],
        },
      } as TextStreamPart<ToolSet>);

      const finalReasoning = processor.getReasoningHistory();
      expect(finalReasoning[0]).toMatchObject({
        type: 'sql',
        status: 'completed',
      });
    });
  });

  describe('Escape Normalization', () => {
    it('should normalize escaped characters in tool arguments', async () => {
      const availableTools = new Set(['execute-sql']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-escape-1',
        toolName: 'execute-sql',
        args: {
          sql: 'SELECT * FROM users WHERE name = \\"John\\"',
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning[0]).toMatchObject({
        type: 'sql',
        sql: 'SELECT * FROM users WHERE name = "John"',
      });
    });

    it('should handle newline escaping in SQL queries', async () => {
      const availableTools = new Set(['execute-sql']);
      const processor = new ChunkProcessor(mockMessageId, [], [], [], undefined, availableTools);

      await processor.processChunk({
        type: 'tool-call',
        toolCallId: 'sql-newline-1',
        toolName: 'execute-sql',
        args: {
          sql: 'SELECT\\n  *\\nFROM\\n  users',
        },
      } as TextStreamPart<ToolSet>);

      const reasoning = processor.getReasoningHistory();
      expect(reasoning[0]).toMatchObject({
        type: 'sql',
        sql: 'SELECT\n  *\nFROM\n  users',
      });
    });
  });
});
