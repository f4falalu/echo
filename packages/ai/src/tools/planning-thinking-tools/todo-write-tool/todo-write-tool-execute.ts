import type { TodoWriteToolContext, TodoWriteToolInput, TodoWriteToolOutput } from './todo-write-tool';
import type { TodoItem } from '../../../agents/analytics-engineer-agent/analytics-engineer-agent';

/**
 * Processes todos by setting timestamps and handling status changes
 */
function processTodos(inputTodos: TodoItem[], existingTodos: TodoItem[]): TodoItem[] {
  const existingById = new Map(existingTodos.map(todo => [todo.id, todo]));
  const now = new Date().toISOString();

  return inputTodos.map(todo => {
    const existing = existingById.get(todo.id);
    const processed = { ...todo };

    // Set createdAt for new todos
    if (!existing) {
      processed.createdAt = processed.createdAt || now;
    } else {
      // Keep existing createdAt
      processed.createdAt = existing.createdAt;
    }

    // Set completedAt when status changes to completed
    if (processed.status === 'completed' && (!existing || existing.status !== 'completed')) {
      processed.completedAt = now;
    }

    // Clear completedAt if status changes from completed to something else
    if (processed.status !== 'completed' && existing?.status === 'completed') {
      processed.completedAt = undefined;
    }

    return processed;
  });
}

/**
 * Creates the execute function for the todo write tool
 */
export function createTodoWriteToolExecute(context: TodoWriteToolContext) {
  return async function execute(input: TodoWriteToolInput): Promise<TodoWriteToolOutput> {
    const { chatId, workingDirectory } = context;
    const { todos: inputTodos } = input;

    console.info(`Writing ${inputTodos.length} todo(s) for chat ${chatId}`);

    try {

      // Load existing todos from disk
      let existingTodos: TodoItem[] = [];
      try {
        const loaded = await loadTodos(chatId, workingDirectory);
        existingTodos = loaded?.todos || [];
      } catch (error) {
        console.warn('Failed to load existing todos:', error);
      }

      // Process the todos (set timestamps, handle status changes)
      const processedTodos = processTodos(inputTodos, existingTodos);

      // Save to disk
      try {
        await saveTodos(chatId, workingDirectory, processedTodos);
      } catch (error) {
        console.error('Failed to save todos to disk:', error);
        return {
          success: false,
          todos: processedTodos,
          message: `Failed to save todos: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

      console.info(`Successfully saved ${processedTodos.length} todo(s)`);

      return {
        success: true,
        todos: processedTodos,
        message: `Successfully updated ${processedTodos.length} todo(s)`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in todo write tool:', errorMessage);

      return {
        success: false,
        todos: [],
        message: `Error: ${errorMessage}`,
      };
    }
  };
}
