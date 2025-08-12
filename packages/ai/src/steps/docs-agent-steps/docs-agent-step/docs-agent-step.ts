import type { Sandbox } from '@buster/sandbox';
import type { ModelMessage } from 'ai';
import { z } from 'zod';
import { createDocsAgent } from '../../../agents/docs-agent/docs-agent';
import { DocsAgentContextSchema } from '../../../agents/docs-agent/docs-agent-context';

// Zod schemas first - following Zod-first approach
export const DocsAgentStepInputSchema = z.object({
  todos: z.string().describe('The todos string'),
  todoList: z.string().describe('The TODO list'),
  message: z.string().describe('The user message'),
  organizationId: z.string().describe('The organization ID'),
  context: DocsAgentContextSchema.describe('The docs agent context'),
  repositoryTree: z.string().describe('The tree structure of the repository'),
});

export const DocsAgentStepOutputSchema = z.object({
  todos: z.array(z.string()).optional().describe('Array of todos'),
  todoList: z.string().optional().describe('The TODO list'),
  documentationCreated: z.boolean().optional().describe('Whether documentation was created'),
  clarificationNeeded: z.boolean().optional().describe('Whether clarification is needed'),
  clarificationQuestion: z
    .object({
      issue: z.string(),
      context: z.string(),
      clarificationQuestion: z.string(),
    })
    .optional()
    .describe('Clarification question details'),
  finished: z.boolean().optional().describe('Whether the agent finished'),
  metadata: z
    .object({
      filesCreated: z.number().optional(),
      toolsUsed: z.array(z.string()).optional(),
    })
    .optional()
    .describe('Metadata about the execution'),
});

// Export types from schemas
export type DocsAgentStepInput = z.infer<typeof DocsAgentStepInputSchema>;
export type DocsAgentStepOutput = z.infer<typeof DocsAgentStepOutputSchema>;

/**
 * Main documentation agent that processes todos and creates documentation
 */
export async function runDocsAgentStep(params: DocsAgentStepInput): Promise<DocsAgentStepOutput> {
  // Validate input
  const validatedParams = DocsAgentStepInputSchema.parse(params);

  // Extract values from context
  const sandbox = validatedParams.context.sandbox as Sandbox;
  const todoList = validatedParams.todoList;
  const dataSourceId = validatedParams.context.dataSourceId;

  // Create abort controller for handling idle tool
  const abortController = new AbortController();

  // Initialize tracking variables
  let documentationCreated = false;
  let clarificationNeeded = false;
  let filesCreated = 0;
  const toolsUsed = new Set<string>();
  let finished = false;
  let updatedClarificationQuestion: any = undefined;

  console.info('[DocsAgent] Starting docs agent execution', {
    hasSandbox: !!sandbox,
    todoListLength: todoList?.length || 0,
    organizationId: validatedParams.organizationId,
    dataSourceId,
  });

  try {
    // Get current working directory from sandbox
    let cwdMessage = '';
    if (sandbox) {
      try {
        const pwdResult = await sandbox.process.executeCommand('pwd');
        const currentDir = pwdResult.result.trim();
        cwdMessage = `cwd: ${currentDir}`;
      } catch (error) {
        console.warn('[DocsAgent] Failed to get current working directory:', error);
      }
    }

    // Create the docs agent with folder structure and context
    const docsAgent = createDocsAgent({
      folder_structure: validatedParams.repositoryTree,
      userId: validatedParams.organizationId, // Using organizationId as userId for now
      chatId: Date.now().toString(), // Using current timestamp as chatId
      dataSourceId: dataSourceId || '',
      organizationId: validatedParams.organizationId || '',
      messageId: undefined, // Optional field
      sandbox: sandbox, // Pass sandbox for file tools
    });

    const userMessage = `${validatedParams.message}`;
    const todoMessage = `<todo-list>\n${todoList}\n</todo-list>`;

    const messages: any[] = [
      {
        role: 'user',
        content: userMessage,
      },
      {
        role: 'user',
        content: todoMessage,
      },
    ];

    // Add cwd message if available (after todo list)
    if (cwdMessage) {
      messages.push({
        role: 'user',
        content: cwdMessage,
      });
    }

    // Execute the docs agent
    const result = await docsAgent.stream({ messages });

    // Process the stream to extract results
    let stepCount = 0;
    let lastTextContent = '';

    for await (const chunk of result.fullStream) {
      // Check if aborted
      if (abortController.signal.aborted) {
        break;
      }

      // Track step count
      if ((chunk as any).type === 'step-start') {
        stepCount++;
        console.log(`[DocsAgent] Step ${stepCount} started`);
      }

      // Log text chunks to see what the agent is thinking
      if (chunk.type === 'text-delta' && (chunk as any).textDelta) {
        lastTextContent += (chunk as any).textDelta;
      }

      if ((chunk as any).type === 'step-finish') {
        console.log(
          `[DocsAgent] Step ${stepCount} finished. Last text: ${lastTextContent.slice(0, 200)}...`
        );
        lastTextContent = '';
      }

      // Track tool usage
      if (chunk.type === 'tool-call') {
        console.log(
          `[DocsAgent] Tool call: ${chunk.toolName} with args:`,
          JSON.stringify((chunk as any).args).slice(0, 200)
        );
        toolsUsed.add(chunk.toolName);

        // Track specific tool outcomes
        if (chunk.toolName === 'createFiles' || chunk.toolName === 'editFiles') {
          console.log(
            `[DocsAgent] Tool ${chunk.toolName} called - marking documentationCreated = true`
          );
          documentationCreated = true;
          filesCreated++;
        }

        if (chunk.toolName === 'updateClarificationsFile') {
          clarificationNeeded = true;
        }

        if (chunk.toolName === 'idleTool') {
          console.log('[DocsAgent] Idle tool called - aborting stream');
          finished = true;
          abortController.abort();
        }
      }

      // Check for clarification updates in tool results
      if (chunk.type === 'tool-result') {
        if (chunk.toolName === 'updateClarificationsFile' && (chunk as any).result) {
          // Store any new clarification questions
          const resultData = (chunk as any).result as Record<string, unknown>;
          if (resultData.clarificationQuestion) {
            updatedClarificationQuestion = resultData.clarificationQuestion;
          }
        }
      }
    }

    console.log('[DocsAgent] Final results:', {
      documentationCreated,
      filesCreated,
      toolsUsed: Array.from(toolsUsed),
      finished,
    });

    return {
      todos: validatedParams.todos.split('\n').filter((line) => line.trim()),
      todoList: validatedParams.todoList,
      documentationCreated,
      clarificationNeeded,
      clarificationQuestion: updatedClarificationQuestion,
      finished,
      metadata: {
        filesCreated,
        toolsUsed: Array.from(toolsUsed),
      },
    };
  } catch (error) {
    // Handle abort error gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      console.info('[DocsAgent] Stream aborted successfully (idle tool called)');

      return {
        todos: validatedParams.todos.split('\n').filter((line) => line.trim()),
        todoList: validatedParams.todoList,
        documentationCreated,
        clarificationNeeded,
        finished: true,
        metadata: {
          filesCreated,
          toolsUsed: Array.from(toolsUsed),
        },
      };
    }

    console.error('[DocsAgent] Error executing docs agent:', error);
    throw new Error(
      `Docs agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
