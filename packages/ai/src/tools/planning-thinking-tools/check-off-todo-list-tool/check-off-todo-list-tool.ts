import type { RuntimeContext } from '@mastra/core/runtime-context';
import { createTool } from '@mastra/core/tools';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { type DocsAgentContext, DocsAgentContextKey } from '../../../context/docs-agent-context';

const checkOffTodoListInputSchema = z.object({
  todoItem: z.string().describe('The exact text of the todo item to check off in the list'),
});

const checkOffTodoListOutputSchema = z.object({
  success: z.boolean(),
  updatedTodoList: z.string().describe('The updated todo list with the item checked off'),
  message: z.string().optional(),
});

const checkOffTodoListExecution = wrapTraced(
  async (
    params: z.infer<typeof checkOffTodoListInputSchema>,
    runtimeContext: RuntimeContext<DocsAgentContext>
  ): Promise<z.infer<typeof checkOffTodoListOutputSchema>> => {
    const { todoItem } = params;

    try {
      // Get the current todo list from context
      const currentTodoList = runtimeContext.get('todoList');

      if (!currentTodoList) {
        return {
          success: false,
          updatedTodoList: '',
          message: 'No todo list found in context',
        };
      }

      // Check if the item exists in the list (not already checked off)
      if (!currentTodoList.includes(`- [ ] ${todoItem}`)) {
        return {
          success: false,
          updatedTodoList: currentTodoList,
          message: `Todo item "${todoItem}" not found in the list or already checked off`,
        };
      }

      // Replace the unchecked item with a checked version
      const updatedTodoList = currentTodoList.replace(`- [ ] ${todoItem}`, `- [x] ${todoItem}`);

      // Update the context with the new todo list
      runtimeContext.set('todoList', updatedTodoList);

      return {
        success: true,
        updatedTodoList,
        message: `Successfully checked off: "${todoItem}"`,
      };
    } catch (error) {
      return {
        success: false,
        updatedTodoList: '',
        message: `Error checking off todo item: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
  { name: 'check-off-todo-list' }
);

export const checkOffTodoList = createTool({
  id: 'check-off-todo-list',
  description:
    'Check off a todo item in the todo list by replacing "- [ ]" with "- [x]". The todo list is maintained as a string in the runtime context.',
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
