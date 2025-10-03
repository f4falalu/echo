import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import type {
  SubagentMessage,
  SubagentToolContext,
  SubagentToolInput,
  SubagentToolOutput,
  ToolEventType,
} from './subagent-tool';

/**
 * Creates the execute function for the subagent tool
 * This function creates a new agent instance and runs it with the provided instructions
 */
export function createSubagentToolExecute(context: SubagentToolContext) {
  return async function execute(input: SubagentToolInput): Promise<SubagentToolOutput> {
    const { projectDirectory, onToolEvent, createAgent } = context;
    const { instructions } = input;

    console.info(`Starting subagent with instructions: ${instructions.substring(0, 100)}...`);

    // Emit start event
    onToolEvent?.({
      tool: 'subagentTool',
      event: 'start',
      args: input,
    });

    try {
      // Collect all messages from the subagent
      const subagentMessages: SubagentMessage[] = [];

      // Create a new agent instance with a callback to collect messages
      const subagent = createAgent({
        folder_structure: projectDirectory,
        userId: 'subagent',
        chatId: randomUUID(),
        dataSourceId: '',
        organizationId: 'subagent',
        messageId: randomUUID(),
        // Callback to collect subagent tool events
        onToolEvent: (event: ToolEventType) => {
          // Collect all tool events as messages
          subagentMessages.push({
            tool: event.tool,
            event: event.event,
            args: event.args,
            result: event.result,
          });
        },
        // Pass flag to indicate this is a subagent (prevents infinite recursion)
        isSubagent: true,
      });

      // Create the user message with instructions
      const messages: ModelMessage[] = [
        {
          role: 'user',
          content: instructions,
        },
      ];

      // Run the subagent
      const stream = await subagent.stream({ messages });

      // Consume the stream to trigger tool execution
      let fullResponse = '';
      for await (const part of stream.fullStream) {
        if (part.type === 'text-delta') {
          fullResponse += part.text;
        }
      }

      // Generate a summary from the final response or messages
      const summary = fullResponse || 'Subagent completed the task';

      console.info(`Subagent completed with ${subagentMessages.length} tool calls`);

      const output: SubagentToolOutput = {
        status: 'success',
        summary: summary.substring(0, 500), // Limit summary length
        messages: subagentMessages,
      };

      // Emit complete event with all collected messages
      onToolEvent?.({
        tool: 'subagentTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Subagent error:`, errorMessage);

      const output: SubagentToolOutput = {
        status: 'error',
        error_message: errorMessage,
      };

      // Emit complete event even on error
      onToolEvent?.({
        tool: 'subagentTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    }
  };
}
