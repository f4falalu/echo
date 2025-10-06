import { describe, expect, it, vi } from 'vitest';
import type { TodoItem } from '../../../agents/analytics-engineer-agent/analytics-engineer-agent';
import type { TodoWriteToolInput } from './todo-write-tool';
import { createTodoWriteToolExecute } from './todo-write-tool-execute';

describe('createTodoWriteToolExecute', () => {
  const chatId = 'test-chat-id';
  const workingDirectory = '/test/directory';

  it('should create new todos with timestamps', async () => {
    // Mock the conversation-history module
    vi.doMock('../../../../../apps/cli/src/utils/conversation-history', () => ({
      loadTodos: vi.fn().mockResolvedValue(null),
      saveTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: [], updatedAt: new Date().toISOString() }),
    }));

    const execute = createTodoWriteToolExecute({ chatId, workingDirectory });
    const input: TodoWriteToolInput = {
      todos: [
        {
          id: '1',
          content: 'First todo',
          status: 'pending',
        },
        {
          id: '2',
          content: 'Second todo',
          status: 'in_progress',
        },
      ],
    };

    const result = await execute(input);

    expect(result.success).toBe(true);
    expect(result.todos).toHaveLength(2);
    expect(result.todos[0]?.createdAt).toBeDefined();
    expect(result.todos[1]?.createdAt).toBeDefined();
  });

  it('should preserve createdAt for existing todos', async () => {
    const existingCreatedAt = '2024-01-01T00:00:00.000Z';
    const existingTodos: TodoItem[] = [
      {
        id: '1',
        content: 'Existing todo',
        status: 'pending',
        createdAt: existingCreatedAt,
      },
    ];

    vi.doMock('../../../../../apps/cli/src/utils/conversation-history', () => ({
      loadTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: existingTodos, updatedAt: new Date().toISOString() }),
      saveTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: existingTodos, updatedAt: new Date().toISOString() }),
    }));

    const execute = createTodoWriteToolExecute({ chatId, workingDirectory });
    const input: TodoWriteToolInput = {
      todos: [
        {
          id: '1',
          content: 'Updated todo',
          status: 'completed',
        },
      ],
    };

    const result = await execute(input);

    expect(result.success).toBe(true);
    expect(result.todos[0]?.createdAt).toBe(existingCreatedAt);
  });

  it('should set completedAt when status changes to completed', async () => {
    const existingTodos: TodoItem[] = [
      {
        id: '1',
        content: 'Todo to complete',
        status: 'in_progress',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    vi.doMock('../../../../../apps/cli/src/utils/conversation-history', () => ({
      loadTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: existingTodos, updatedAt: new Date().toISOString() }),
      saveTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: existingTodos, updatedAt: new Date().toISOString() }),
    }));

    const execute = createTodoWriteToolExecute({ chatId, workingDirectory });
    const input: TodoWriteToolInput = {
      todos: [
        {
          id: '1',
          content: 'Todo to complete',
          status: 'completed',
        },
      ],
    };

    const result = await execute(input);

    expect(result.success).toBe(true);
    expect(result.todos[0]?.completedAt).toBeDefined();
  });

  it('should clear completedAt when status changes from completed', async () => {
    const existingTodos: TodoItem[] = [
      {
        id: '1',
        content: 'Completed todo',
        status: 'completed',
        createdAt: '2024-01-01T00:00:00.000Z',
        completedAt: '2024-01-02T00:00:00.000Z',
      },
    ];

    vi.doMock('../../../../../apps/cli/src/utils/conversation-history', () => ({
      loadTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: existingTodos, updatedAt: new Date().toISOString() }),
      saveTodos: vi.fn().mockResolvedValue({ chatId, workingDirectory, todos: existingTodos, updatedAt: new Date().toISOString() }),
    }));

    const execute = createTodoWriteToolExecute({ chatId, workingDirectory });
    const input: TodoWriteToolInput = {
      todos: [
        {
          id: '1',
          content: 'Completed todo',
          status: 'in_progress',
        },
      ],
    };

    const result = await execute(input);

    expect(result.success).toBe(true);
    expect(result.todos[0]?.completedAt).toBeUndefined();
  });
});
