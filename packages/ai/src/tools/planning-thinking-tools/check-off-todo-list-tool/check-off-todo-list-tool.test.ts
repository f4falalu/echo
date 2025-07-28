import { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DocsAgentContext } from '../../../context/docs-agent-context';
import { checkOffTodoList } from './check-off-todo-list-tool';

describe('checkOffTodoList', () => {
  let runtimeContext: RuntimeContext<DocsAgentContext>;

  beforeEach(() => {
    runtimeContext = new RuntimeContext<DocsAgentContext>();
  });

  it('should check off a single todo item successfully', async () => {
    const initialTodoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    runtimeContext.set('todoList', initialTodoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Write unit tests'] },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [ ] Review code');
    expect(result.message).toBe('Successfully checked off all 1 items');
    expect(result.checkedOffItems).toEqual(['Write unit tests']);
    expect(result.failedItems).toEqual([]);

    // Verify context was updated
    const updatedContext = runtimeContext.get('todoList');
    expect(updatedContext).toBe(result.updatedTodoList);
  });

  it('should check off multiple todo items successfully', async () => {
    const initialTodoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code
- [ ] Deploy to production`;

    runtimeContext.set('todoList', initialTodoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Write unit tests', 'Review code'] },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [x] Review code');
    expect(result.updatedTodoList).toContain('- [ ] Deploy to production');
    expect(result.message).toBe('Successfully checked off all 2 items');
    expect(result.checkedOffItems).toEqual(['Write unit tests', 'Review code']);
    expect(result.failedItems).toEqual([]);
  });

  it('should handle partial success when some items are not found', async () => {
    const initialTodoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    runtimeContext.set('todoList', initialTodoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Write unit tests', 'Non-existent task', 'Review code'] },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [x] Review code');
    expect(result.message).toBe('Successfully checked off 2 out of 3 items');
    expect(result.checkedOffItems).toEqual(['Write unit tests', 'Review code']);
    expect(result.failedItems).toEqual(['Non-existent task']);
  });

  it('should return error when todo list is not found in context', async () => {
    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Some task', 'Another task'] },
      runtimeContext,
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe('');
    expect(result.message).toBe('No todo list found in context');
    expect(result.checkedOffItems).toEqual([]);
    expect(result.failedItems).toEqual(['Some task', 'Another task']);
  });

  it('should return error when no items could be checked off', async () => {
    const todoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Non-existent task', 'Another missing task'] },
      runtimeContext,
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe(todoList);
    expect(result.message).toBe(
      'No items were checked off - they may not exist or are already checked'
    );
    expect(result.checkedOffItems).toEqual([]);
    expect(result.failedItems).toEqual(['Non-existent task', 'Another missing task']);
  });

  it('should not check off already checked items', async () => {
    const todoList = `## Todo List
- [x] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Write unit tests', 'Implement feature'] },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [x] Implement feature');
    expect(result.message).toBe('Successfully checked off 1 out of 2 items');
    expect(result.checkedOffItems).toEqual(['Implement feature']);
    expect(result.failedItems).toEqual(['Write unit tests']);
  });

  it('should handle empty array of todo items', async () => {
    const todoList = `## Todo List
- [ ] Write unit tests`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: [] },
      runtimeContext,
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe(todoList);
    expect(result.checkedOffItems).toEqual([]);
    expect(result.failedItems).toEqual([]);
  });

  it('should handle first occurrence when there are duplicates', async () => {
    const todoList = `## Todo List
- [ ] Write unit tests
- [ ] Write unit tests
- [ ] Implement feature`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItems: ['Write unit tests'] },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    // Only the first occurrence should be checked off
    const lines = result.updatedTodoList.split('\n');
    expect(lines[1]).toBe('- [x] Write unit tests');
    expect(lines[2]).toBe('- [ ] Write unit tests');
    expect(result.checkedOffItems).toEqual(['Write unit tests']);
  });

  it('should validate input schema', () => {
    const validInput = { todoItems: ['Test task', 'Another task'] };
    const parsed = checkOffTodoList.inputSchema.parse(validInput);
    expect(parsed).toEqual(validInput);

    // Empty array should be valid
    const emptyInput = { todoItems: [] };
    const emptyParsed = checkOffTodoList.inputSchema.parse(emptyInput);
    expect(emptyParsed).toEqual(emptyInput);

    expect(() => {
      checkOffTodoList.inputSchema.parse({ todoItems: 'not an array' });
    }).toThrow();

    expect(() => {
      checkOffTodoList.inputSchema.parse({ todoItems: [123, 456] });
    }).toThrow();

    expect(() => {
      checkOffTodoList.inputSchema.parse({});
    }).toThrow();
  });

  it('should validate output schema', () => {
    const validOutput = {
      success: true,
      updatedTodoList: '- [x] Done',
      message: 'Success',
      checkedOffItems: ['Done'],
      failedItems: [],
    };
    const parsed = checkOffTodoList.outputSchema.parse(validOutput);
    expect(parsed).toEqual(validOutput);

    const minimalOutput = {
      success: false,
      updatedTodoList: '',
      checkedOffItems: [],
      failedItems: ['Failed item'],
    };
    const minimalParsed = checkOffTodoList.outputSchema.parse(minimalOutput);
    expect(minimalParsed).toEqual(minimalOutput);
  });
});
