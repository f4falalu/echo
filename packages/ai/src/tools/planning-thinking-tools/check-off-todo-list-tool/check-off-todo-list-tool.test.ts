import { RuntimeContext } from '@mastra/core/runtime-context';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DocsAgentContext } from '../../../context/docs-agent-context';
import { checkOffTodoList } from './check-off-todo-list-tool';

describe('checkOffTodoList', () => {
  let runtimeContext: RuntimeContext<DocsAgentContext>;

  beforeEach(() => {
    runtimeContext = new RuntimeContext<DocsAgentContext>();
  });

  it('should check off a todo item successfully', async () => {
    const initialTodoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature
- [ ] Review code`;

    runtimeContext.set('todoList', initialTodoList);

    const result = await checkOffTodoList.execute({
      context: { todoItem: 'Write unit tests' },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toContain('- [x] Write unit tests');
    expect(result.updatedTodoList).toContain('- [ ] Implement feature');
    expect(result.updatedTodoList).toContain('- [ ] Review code');
    expect(result.message).toBe('Successfully checked off: "Write unit tests"');

    // Verify context was updated
    const updatedContext = runtimeContext.get('todoList');
    expect(updatedContext).toBe(result.updatedTodoList);
  });

  it('should return error when todo list is not found in context', async () => {
    const result = await checkOffTodoList.execute({
      context: { todoItem: 'Some task' },
      runtimeContext,
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe('');
    expect(result.message).toBe('No todo list found in context');
  });

  it('should return error when todo item is not found', async () => {
    const todoList = `## Todo List
- [ ] Write unit tests
- [ ] Implement feature`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItem: 'Non-existent task' },
      runtimeContext,
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe(todoList);
    expect(result.message).toBe(
      'Todo item "Non-existent task" not found in the list or already checked off'
    );
  });

  it('should not check off an already checked item', async () => {
    const todoList = `## Todo List
- [x] Write unit tests
- [ ] Implement feature`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItem: 'Write unit tests' },
      runtimeContext,
    });

    expect(result.success).toBe(false);
    expect(result.updatedTodoList).toBe(todoList);
    expect(result.message).toBe(
      'Todo item "Write unit tests" not found in the list or already checked off'
    );
  });

  it('should handle first occurrence when there are duplicates', async () => {
    const todoList = `## Todo List
- [ ] Write unit tests for feature A
- [ ] Write unit tests`;

    runtimeContext.set('todoList', todoList);

    const result = await checkOffTodoList.execute({
      context: { todoItem: 'Write unit tests for feature A' },
      runtimeContext,
    });

    expect(result.success).toBe(true);
    expect(result.updatedTodoList).toBe(`## Todo List
- [x] Write unit tests for feature A
- [ ] Write unit tests`);
  });

  it('should validate input schema', () => {
    const validInput = { todoItem: 'Test task' };
    const parsed = checkOffTodoList.inputSchema.parse(validInput);
    expect(parsed).toEqual(validInput);

    expect(() => {
      checkOffTodoList.inputSchema.parse({ todoItem: 123 });
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
    };
    const parsed = checkOffTodoList.outputSchema.parse(validOutput);
    expect(parsed).toEqual(validOutput);

    const minimalOutput = {
      success: false,
      updatedTodoList: '',
    };
    const minimalParsed = checkOffTodoList.outputSchema.parse(minimalOutput);
    expect(minimalParsed).toEqual(minimalOutput);
  });
});
