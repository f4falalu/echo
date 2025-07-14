import { describe, it, expect } from 'vitest';
import type { CoreMessage } from 'ai';
import { cleanupIncompleteToolCalls } from '../../../src/utils/retry';

describe('cleanupIncompleteToolCalls', () => {
  it('should remove assistant message with orphaned tool call', () => {
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Hello'
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me help' },
          { type: 'tool-call', toolCallId: '123', toolName: 'getTodo', args: {} }
        ]
      }
      // No tool result - orphaned
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(1);
    expect(cleaned[0]?.role).toBe('user');
  });

  it('should preserve complete tool call/result pairs', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: '123', toolName: 'getTodo', args: {} }
        ]
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: '123', toolName: 'getTodo', result: { todo: 'test' } }
        ]
      }
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(2);
    expect(cleaned[0]?.role).toBe('assistant');
    expect(cleaned[1]?.role).toBe('tool');
  });

  it('should handle mixed complete and incomplete tool calls', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: '123', toolName: 'getTodo', args: {} },
        ]
      }
      // Missing result for toolCallId '456' - partially orphaned
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(0); // Both messages removed because assistant message had orphaned call
  });

  it('should handle multiple assistant messages and only clean the last one', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: '111', toolName: 'getTodo', args: {} }
        ]
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: '111', toolName: 'getTodo', result: { todo: 'first' } }
        ]
      },
      {
        role: 'user',
        content: 'Another request'
      },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Processing...' },
          { type: 'tool-call', toolCallId: '222', toolName: 'createTodo', args: { title: 'new' } }
        ]
      }
      // No result for '222' - orphaned
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(3); // Only last assistant message removed
    expect(cleaned[0]?.role).toBe('assistant');
    expect(cleaned[1]?.role).toBe('tool');
    expect(cleaned[2]?.role).toBe('user');
  });

  it('should handle assistant messages with only text content', () => {
    const messages: CoreMessage[] = [
      {
        role: 'user',
        content: 'Hello'
      },
      {
        role: 'assistant',
        content: 'Hi there, how can I help?'
      }
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(2); // No changes
    expect(cleaned).toEqual(messages);
  });

  it('should handle empty message array', () => {
    const messages: CoreMessage[] = [];
    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(0);
  });

  it('should handle messages with mixed content types', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Let me search for that' },
          { type: 'tool-call', toolCallId: '789', toolName: 'search', args: { query: 'test' } },
          { type: 'text', text: 'Searching now...' }
        ]
      }
      // No tool result - orphaned
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(0); // Removed due to orphaned tool call
  });

  it('should handle tool results that appear before their calls', () => {
    const messages: CoreMessage[] = [
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: '999', toolName: 'getTodo', result: { error: 'Not found' } }
        ]
      },
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: '999', toolName: 'getTodo', args: {} }
        ]
      }
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(1); // Assistant message removed, tool result remains
    expect(cleaned[0]?.role).toBe('tool');
  });

  it('should handle multiple tool results in single message', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'tool-call', toolCallId: 'abc', toolName: 'getTodo', args: {} },
          { type: 'tool-call', toolCallId: 'def', toolName: 'createTodo', args: { title: 'new' } }
        ]
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-result', toolCallId: 'abc', toolName: 'getTodo', result: { todo: 'existing' } },
          { type: 'tool-result', toolCallId: 'def', toolName: 'createTodo', result: { id: 1, title: 'new' } }
        ]
      }
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(2); // All complete, no changes
    expect(cleaned).toEqual(messages);
  });

  it('should handle assistant message with no tool calls', () => {
    const messages: CoreMessage[] = [
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Here is your answer' }
        ]
      }
    ];

    const cleaned = cleanupIncompleteToolCalls(messages);
    expect(cleaned).toHaveLength(1); // No changes
    expect(cleaned).toEqual(messages);
  });
});