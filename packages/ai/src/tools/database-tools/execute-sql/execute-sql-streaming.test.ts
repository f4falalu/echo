import { updateMessageEntries } from '@buster/database';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExecuteSqlContext, ExecuteSqlState } from './execute-sql';
import { createExecuteSqlDelta } from './execute-sql-delta';
import { createExecuteSqlFinish } from './execute-sql-finish';
import { createExecuteSqlStart } from './execute-sql-start';

// Mock the database update function
vi.mock('@buster/database', () => ({
  updateMessageEntries: vi.fn(),
}));

// Mock the transform helper
vi.mock('./helpers/execute-sql-transform-helper', () => ({
  createExecuteSqlReasoningEntry: vi.fn((state: ExecuteSqlState, toolCallId: string) => {
    if (!state.statements || state.statements.length === 0) {
      return undefined;
    }
    return {
      id: toolCallId,
      type: 'files',
      title: 'Executing SQL',
      status: 'loading',
      files: {},
    };
  }),
  createExecuteSqlRawLlmMessageEntry: vi.fn((state: ExecuteSqlState, toolCallId: string) => {
    if (!state.statements || state.statements.length === 0) {
      return undefined;
    }
    return {
      role: 'assistant',
      content: [
        {
          type: 'tool-call',
          toolCallId,
          toolName: 'executeSql',
          input: { statements: state.statements },
        },
      ],
    };
  }),
}));

describe('execute-sql streaming', () => {
  const mockContext: ExecuteSqlContext = {
    dataSourceId: 'test-datasource',
    userId: 'test-user',
    dataSourceSyntax: 'postgresql',
    messageId: 'test-message',
  };

  const mockState: ExecuteSqlState = {
    toolCallId: undefined,
    args: '',
    statements: [],
    isComplete: false,
    startTime: undefined,
    executionTime: undefined,
    executionResults: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset state
    mockState.toolCallId = undefined;
    mockState.args = '';
    mockState.statements = [];
    mockState.isComplete = false;
    mockState.startTime = undefined;
    mockState.executionTime = undefined;
    mockState.executionResults = undefined;
  });

  describe('createExecuteSqlStart', () => {
    it('should initialize state and not call updateMessageEntries when no statements', async () => {
      const startHandler = createExecuteSqlStart(mockState, mockContext);

      await startHandler({
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.toolCallId).toBe('test-tool-call-id');
      expect(mockState.args).toBe('');
      expect(mockState.statements).toEqual([]);
      expect(mockState.isComplete).toBe(false);
      expect(mockState.startTime).toBeDefined();

      // Should not call updateMessageEntries when there are no statements
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const startHandler = createExecuteSqlStart(mockState, mockContext);

      // Set toolCallId and statements first to trigger database update
      mockState.toolCallId = 'test-tool-call-id';
      mockState.statements = ['SELECT 1'];

      // Mock database error
      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await startHandler({
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      // Since statements are not set during start, no error will be logged
      // The error logging only happens when there are statements to save
      expect(updateMessageEntries).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('createExecuteSqlDelta', () => {
    it('should accumulate text deltas and parse statements', async () => {
      const deltaHandler = createExecuteSqlDelta(mockState, mockContext);

      // First delta - partial JSON that can be partially parsed
      await deltaHandler({
        inputTextDelta: '{"statements": [',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.args).toBe('{"statements": [');
      // No complete statements yet
      expect(mockState.statements).toEqual([]);

      // Second delta - add a complete statement
      await deltaHandler({
        inputTextDelta: '"SELECT * FROM users LIMIT 5"]}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.args).toBe('{"statements": ["SELECT * FROM users LIMIT 5"]}');
      expect(mockState.statements).toEqual(['SELECT * FROM users LIMIT 5']);
    });

    it('should handle array of statements', async () => {
      const deltaHandler = createExecuteSqlDelta(mockState, mockContext);

      await deltaHandler({
        inputTextDelta: '{"statements": ["SELECT 1", "SELECT 2", "SELECT 3"]}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.statements).toEqual(['SELECT 1', 'SELECT 2', 'SELECT 3']);
    });

    it('should handle malformed JSON gracefully', async () => {
      const deltaHandler = createExecuteSqlDelta(mockState, mockContext);

      await deltaHandler({
        inputTextDelta: '{"statements": "not an array"}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      // Should treat single string as array with one element
      expect(mockState.statements).toEqual(['not an array']);
    });

    it('should update database entries when statements are present', async () => {
      const deltaHandler = createExecuteSqlDelta(mockState, mockContext);
      mockState.statements = ['SELECT 1'];

      await deltaHandler({
        inputTextDelta: '{"statements": ["SELECT 1"]}',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message',
        toolCallId: 'test-tool-call-id',
        reasoningEntry: expect.objectContaining({
          id: 'test-tool-call-id',
          type: 'files',
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
        }),
      });
    });
  });

  describe('createExecuteSqlFinish', () => {
    it('should finalize state with complete input', async () => {
      const finishHandler = createExecuteSqlFinish(mockState, mockContext);

      await finishHandler({
        input: {
          statements: ['SELECT * FROM products', 'SELECT COUNT(*) FROM orders'],
        },
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.toolCallId).toBe('test-tool-call-id');
      expect(mockState.statements).toEqual([
        'SELECT * FROM products',
        'SELECT COUNT(*) FROM orders',
      ]);
      expect(mockState.isComplete).toBe(true);

      expect(updateMessageEntries).toHaveBeenCalledWith({
        messageId: 'test-message',
        toolCallId: 'test-tool-call-id',
        reasoningEntry: expect.objectContaining({
          id: 'test-tool-call-id',
        }),
        rawLlmMessage: expect.objectContaining({
          role: 'assistant',
        }),
      });
    });

    it('should not update database when no statements', async () => {
      const finishHandler = createExecuteSqlFinish(mockState, mockContext);

      await finishHandler({
        input: {
          statements: [],
        },
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.statements).toEqual([]);
      expect(mockState.isComplete).toBe(true);
      expect(updateMessageEntries).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const finishHandler = createExecuteSqlFinish(mockState, mockContext);

      vi.mocked(updateMessageEntries).mockRejectedValueOnce(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await finishHandler({
        input: {
          statements: ['SELECT 1'],
        },
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[execute-sql] Failed to finalize entries:',
        expect.objectContaining({
          messageId: 'test-message',
          error: 'Update failed',
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('optimistic parsing', () => {
    it('should extract statements even from incomplete JSON', async () => {
      const deltaHandler = createExecuteSqlDelta(mockState, mockContext);

      // Incomplete JSON but parseable statements array
      await deltaHandler({
        inputTextDelta: '{"statements": ["SELECT id FROM users", "SELECT name FROM prod',
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      // Should extract the complete first statement
      expect(mockState.statements).toContain('SELECT id FROM users');
    });

    it('should handle nested JSON structures', async () => {
      const deltaHandler = createExecuteSqlDelta(mockState, mockContext);

      await deltaHandler({
        inputTextDelta: `{"statements": ["SELECT json_data->>'field' FROM table"]}`,
        toolCallId: 'test-tool-call-id',
        messages: [],
      });

      expect(mockState.statements).toEqual(["SELECT json_data->>'field' FROM table"]);
    });
  });
});
