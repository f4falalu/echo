import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKey } from '../../../context/docs-agent-context';

const checkOffTodoListInputSchema = z.object({
  todoItems: z.array(z.string()).describe('An array of todo item texts to check off in the list'),
});

const checkOffTodoListOutputSchema = z.object({
  success: z.boolean(),
  updatedTodoList: z.string().describe('The updated todo list with the items checked off'),
  message: z.string().optional(),
  checkedOffItems: z.array(z.string()).describe('List of items that were successfully checked off'),
  failedItems: z.array(z.string()).describe('List of items that could not be checked off'),
});

const checkOffTodoListExecution = wrapTraced(
  async (
    params: z.infer<typeof checkOffTodoListInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof checkOffTodoListOutputSchema>> => {
    const { todoItems } = params;

    try {
      // Get the current todo list from context
      const currentTodoList = runtimeContext.get('todoList');

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
      runtimeContext.set('todoList', updatedTodoList);

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
  { name: 'check-off-todo-list' }
);

export const checkOffTodoList = createTool({
  id: 'check-off-todo-list',
  description:
    'Check off multiple todo items in the todo list by replacing "- [ ]" with "- [x]" for each item. The todo list is maintained as a string in the runtime context.',
  inputSchema: checkOffTodoListInputSchema,
  outputSchema: checkOffTodoListOutputSchema,
  execute: async ({
    context,
    runtimeContext,
  }: {
    context: z.infer<typeof checkOffTodoListInputSchema>;
    runtimeContext: RuntimeContext<DocsAgentContext>;
  }) => {
    return await checkOffTodoListExecution(context, runtimeContext);
  },
});

export default checkOffTodoList;
