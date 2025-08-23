import { wrapTraced } from 'braintrust';
import type {
  CheckOffTodoListToolContext,
  CheckOffTodoListToolInput,
  CheckOffTodoListToolOutput,
} from './check-off-todo-list-tool';

export function createCheckOffTodoListToolExecute(context: CheckOffTodoListToolContext) {
  return wrapTraced(
    async (input: CheckOffTodoListToolInput): Promise<CheckOffTodoListToolOutput> => {
      const { todoItems } = input;

      try {
        // Get the current todo list from context
        const currentTodoList = context.todoList;

        if (!currentTodoList) {
          return {
            success: false,
            updatedTodoList: '',
            message: 'No todo list found in context',
            checkedOffItems: [],
            failedItems: todoItems,
          };
        }

        let updatedTodoList = currentTodoList;
        const checkedOffItems: string[] = [];
        const failedItems: string[] = [];

        // Process each todo item
        for (const todoItem of todoItems) {
          // Check if the item exists in the list (not already checked off)
          if (updatedTodoList.includes(`- [ ] ${todoItem}`)) {
            // Replace the unchecked item with a checked version
            updatedTodoList = updatedTodoList.replace(`- [ ] ${todoItem}`, `- [x] ${todoItem}`);
            checkedOffItems.push(todoItem);
          } else {
            failedItems.push(todoItem);
          }
        }

        // Update the context with the new todo list
        if (context.updateTodoList) {
          context.updateTodoList(updatedTodoList);
        }

        const success = checkedOffItems.length > 0;
        let message = '';

        if (checkedOffItems.length === todoItems.length) {
          message = `Successfully checked off all ${checkedOffItems.length} items`;
        } else if (checkedOffItems.length > 0) {
          message = `Successfully checked off ${checkedOffItems.length} out of ${todoItems.length} items`;
        } else {
          message = 'No items were checked off - they may not exist or are already checked';
        }

        return {
          success,
          updatedTodoList,
          message,
          checkedOffItems,
          failedItems,
        };
      } catch (error) {
        return {
          success: false,
          updatedTodoList: '',
          message: `Error checking off todo items: ${error instanceof Error ? error.message : 'Unknown error'}`,
          checkedOffItems: [],
          failedItems: todoItems,
        };
      }
    },
    { name: 'check-off-todo-list-execute' }
  );
}
