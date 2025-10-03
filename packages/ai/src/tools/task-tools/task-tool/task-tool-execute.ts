import { randomUUID } from 'node:crypto';
import type { ModelMessage } from 'ai';
import type { TaskToolContext, TaskToolInput, TaskToolOutput, ToolEventType } from './task-tool';

// Import AgentMessage type from CLI (or define a compatible version here)
// For now, we'll create a type-compatible structure that matches the CLI's AgentMessage
type TaskAgentMessage =
  | { kind: 'idle'; args: { final_response?: string } }
  | {
      kind: 'bash';
      event: 'start' | 'complete';
      args: { command: string; description?: string };
      result?: { stdout?: string; stderr?: string; exitCode: number; success: boolean };
    }
  | {
      kind: 'grep';
      event: 'start' | 'complete';
      args: { pattern: string; glob?: string; command: string };
      result?: {
        matches: Array<{ path: string; lineNum: number; lineText: string }>;
        totalMatches: number;
        truncated: boolean;
      };
    }
  | {
      kind: 'ls';
      event: 'start' | 'complete';
      args: { path?: string; command: string };
      result?: {
        output: string;
        success: boolean;
        count: number;
        truncated: boolean;
        errorMessage?: string;
      };
    }
  | {
      kind: 'write';
      event: 'start' | 'complete';
      args: { files: Array<{ path: string; content: string }> };
      result?: {
        results: Array<{ status: 'success' | 'error'; filePath: string; errorMessage?: string }>;
      };
    }
  | {
      kind: 'edit';
      event: 'start' | 'complete';
      args: {
        filePath: string;
        oldString?: string;
        newString?: string;
        edits?: Array<{ oldString: string; newString: string }>;
      };
      result?: {
        success: boolean;
        filePath: string;
        diff?: string;
        finalDiff?: string;
        message?: string;
        errorMessage?: string;
      };
    }
  | {
      kind: 'read';
      event: 'start' | 'complete';
      args: { filePath: string };
      result?: {
        status: 'success' | 'error';
        file_path: string;
        content?: string;
        truncated?: boolean;
        error_message?: string;
      };
    };

/**
 * Creates the execute function for the task tool
 * This function creates a new agent instance and runs it with the provided instructions
 */
export function createTaskToolExecute(context: TaskToolContext) {
  return async function execute(input: TaskToolInput): Promise<TaskToolOutput> {
    const { projectDirectory, onToolEvent, createAgent } = context;
    const { instructions } = input;

    console.info(`Starting task with instructions: ${instructions.substring(0, 100)}...`);

    // Emit start event
    onToolEvent?.({
      tool: 'taskTool',
      event: 'start',
      args: input,
    });

    try {
      // Collect all messages from the task
      const taskMessages: TaskAgentMessage[] = [];

      // Create a new agent instance with a callback to collect messages
      const taskAgent = createAgent({
        folder_structure: projectDirectory,
        userId: 'task',
        chatId: randomUUID(),
        dataSourceId: '',
        organizationId: 'task',
        messageId: randomUUID(),
        // Callback to collect task tool events
        onToolEvent: (event: ToolEventType) => {
          // Convert tool events to properly typed AgentMessage format
          // This mirrors the logic in analytics-engineer-handler.ts

          if (event.tool === 'idleTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'idle',
              args: event.args as { final_response?: string },
            });
          }

          if (event.tool === 'bashTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'bash',
              event: 'complete',
              args: event.args as { command: string; description?: string },
              result: event.result as {
                stdout?: string;
                stderr?: string;
                exitCode: number;
                success: boolean;
              },
            });
          }

          if (event.tool === 'grepTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'grep',
              event: 'complete',
              args: event.args as { pattern: string; glob?: string; command: string },
              result: event.result as {
                matches: Array<{ path: string; lineNum: number; lineText: string }>;
                totalMatches: number;
                truncated: boolean;
              },
            });
          }

          if (event.tool === 'lsTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'ls',
              event: 'complete',
              args: event.args as { path?: string; command: string },
              result: event.result as {
                output: string;
                success: boolean;
                count: number;
                truncated: boolean;
                errorMessage?: string;
              },
            });
          }

          if (event.tool === 'writeFileTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'write',
              event: 'complete',
              args: event.args as { files: Array<{ path: string; content: string }> },
              result: event.result as {
                results: Array<{
                  status: 'success' | 'error';
                  filePath: string;
                  errorMessage?: string;
                }>;
              },
            });
          }

          if (event.tool === 'editFileTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'edit',
              event: 'complete',
              args: event.args as {
                filePath: string;
                oldString?: string;
                newString?: string;
                edits?: Array<{ oldString: string; newString: string }>;
              },
              result: event.result as {
                success: boolean;
                filePath: string;
                diff?: string;
                finalDiff?: string;
                message?: string;
                errorMessage?: string;
              },
            });
          }

          if (event.tool === 'readFileTool' && event.event === 'complete') {
            taskMessages.push({
              kind: 'read',
              event: 'complete',
              args: event.args as { filePath: string },
              result: event.result as {
                status: 'success' | 'error';
                file_path: string;
                content?: string;
                truncated?: boolean;
                error_message?: string;
              },
            });
          }
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

      // Run the task agent
      const stream = await taskAgent.stream({ messages });

      // Consume the stream to trigger tool execution
      let fullResponse = '';
      for await (const part of stream.fullStream) {
        if (part.type === 'text-delta') {
          fullResponse += part.text;
        }
      }

      // Generate a summary from the final response or messages
      const summary = fullResponse || 'Task completed';

      console.info(`Task completed with ${taskMessages.length} tool calls`);

      const output: TaskToolOutput = {
        status: 'success',
        summary: summary.substring(0, 500), // Limit summary length
        messages: taskMessages,
      };

      // Emit complete event with all collected messages
      onToolEvent?.({
        tool: 'taskTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Task error:`, errorMessage);

      const output: TaskToolOutput = {
        status: 'error',
        error_message: errorMessage,
      };

      // Emit complete event even on error
      onToolEvent?.({
        tool: 'taskTool',
        event: 'complete',
        result: output,
        args: input,
      });

      return output;
    }
  };
}
