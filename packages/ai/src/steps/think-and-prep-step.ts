import type { ChatMessageReasoningMessage } from '@buster/server-shared/chats';
import { createStep } from '@mastra/core';
import type { RuntimeContext } from '@mastra/core/runtime-context';
import type { CoreMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { thinkAndPrepAgent } from '../agents/think-and-prep-agent/think-and-prep-agent';
import type { thinkAndPrepWorkflowInputSchema } from '../schemas/workflow-schemas';
import { ChunkProcessor } from '../utils/database/chunk-processor';
import {
  RetryWithHealingError,
  detectRetryableError,
  isRetryWithHealingError,
} from '../utils/retry';
import type { RetryableError, WorkflowContext } from '../utils/retry/types';
import { appendToConversation, standardizeMessages } from '../utils/standardizeMessages';
import { createOnChunkHandler, handleStreamingError } from '../utils/streaming';
import type { AnalystRuntimeContext } from '../workflows/analyst-workflow';
import { createTodosOutputSchema } from './create-todos-step';
import { extractValuesSearchOutputSchema } from './extract-values-search-step';
import { generateChatTitleOutputSchema } from './generate-chat-title-step';

const inputSchema = z.object({
  'create-todos': createTodosOutputSchema,
  'extract-values-search': extractValuesSearchOutputSchema,
  'generate-chat-title': generateChatTitleOutputSchema,
  // Include original workflow inputs to maintain access to prompt and conversationHistory
  prompt: z.string(),
  conversationHistory: z.array(z.any()).optional(),
  dashboardFiles: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        versionNumber: z.number(),
        metricIds: z.array(z.string()),
      })
    )
    .optional(),
});

import {
  extractMessageHistory,
  getAllToolsUsed,
  getLastToolUsed,
} from '../utils/memory/message-history';
import { createStoredValuesToolCallMessage } from '../utils/memory/stored-values-to-messages';
import { createTodoToolCallMessage } from '../utils/memory/todos-to-messages';
import {
  type BusterChatMessageReasoningSchema,
  type BusterChatMessageResponseSchema,
  type MessageHistory,
  type StepFinishData,
  ThinkAndPrepOutputSchema,
} from '../utils/memory/types';

type BusterChatMessageReasoning = z.infer<typeof BusterChatMessageReasoningSchema>;
type BusterChatMessageResponse = z.infer<typeof BusterChatMessageResponseSchema>;

const outputSchema = ThinkAndPrepOutputSchema;

// Helper function to create the result object
const createStepResult = (
  finished: boolean,
  outputMessages: MessageHistory,
  finalStepData: StepFinishData | null,
  reasoningHistory: BusterChatMessageReasoning[] = [],
  responseHistory: BusterChatMessageResponse[] = [],
  dashboardContext?: Array<{
    id: string;
    name: string;
    versionNumber: number;
    metricIds: string[];
  }>
): z.infer<typeof outputSchema> => ({
  finished,
  outputMessages,
  conversationHistory: outputMessages,
  stepData: finalStepData || undefined,
  reasoningHistory,
  responseHistory,
  metadata: {
    toolsUsed: getAllToolsUsed(outputMessages),
    finalTool: getLastToolUsed(outputMessages) as
      | 'submitThoughts'
      | 'respondWithoutAnalysis'
      | 'messageUserClarifyingQuestion'
      | undefined,
    text: undefined,
    reasoning: undefined,
  },
  dashboardContext,
});

const thinkAndPrepExecution = async ({
  inputData,
  getInitData,
  runtimeContext,
}: {
  inputData: z.infer<typeof inputSchema>;
  getInitData: () => Promise<z.infer<typeof thinkAndPrepWorkflowInputSchema>>;
  runtimeContext: RuntimeContext<AnalystRuntimeContext>;
}): Promise<z.infer<typeof outputSchema>> => {
  const abortController = new AbortController();
  const messageId = runtimeContext.get('messageId') as string | null;

  let outputMessages: MessageHistory = [];
  let completeConversationHistory: MessageHistory = [];
  let finished = false;
  const finalStepData: StepFinishData | null = null;
  let retryCount = 0;
  const maxRetries = 5;

  // Extract reasoning history from create-todos step
  const rawReasoningHistory = inputData['create-todos'].reasoningHistory || [];

  // Use reasoning history directly without unnecessary property reordering
  const initialReasoningHistory = rawReasoningHistory as ChatMessageReasoningMessage[];

  // Get initial data early to have dashboard context
  const initData = await getInitData();
  const dashboardFiles = (initData.dashboardFiles || []) as Array<{
    id: string;
    name: string;
    versionNumber: number;
    metricIds: string[];
  }>;

  // Initialize chunk processor with initial messages, reasoning history, and dashboard context
  const availableTools = new Set([
    'sequentialThinking',
    'executeSql',
    'respondWithoutAnalysis',
    'submitThoughts',
    'messageUserClarifyingQuestion',
  ]);

  // Get workflow start time from runtime context
  const workflowStartTime = runtimeContext.get('workflowStartTime');

  const chunkProcessor = new ChunkProcessor(
    messageId,
    [],
    initialReasoningHistory,
    [],
    dashboardFiles, // Pass dashboard context
    availableTools,
    workflowStartTime
  );

  try {
    const todos = inputData['create-todos'].todos;

    // Standardize messages from workflow inputs
    const inputPrompt = initData.prompt;
    const conversationHistory = initData.conversationHistory || [];

    // Create base messages from prompt
    let baseMessages: CoreMessage[];
    if (conversationHistory.length > 0) {
      // If we have conversation history, append the new prompt to it
      baseMessages = appendToConversation(conversationHistory, inputPrompt);
    } else {
      // Otherwise, just use the prompt as a new conversation
      baseMessages = standardizeMessages(inputPrompt);
    }

    // Create todo messages and inject them into the conversation history
    const todoCallMessage = createTodoToolCallMessage(todos);
    let messages: CoreMessage[] = [...baseMessages, todoCallMessage];

    // Inject stored values search results if available
    const storedValuesResults = inputData['extract-values-search'].searchResults;
    if (storedValuesResults && inputData['extract-values-search'].searchPerformed) {
      const storedValuesMessage = createStoredValuesToolCallMessage(storedValuesResults);
      messages.push(storedValuesMessage);
    }

    console.info('Think and Prep: Initial messages setup', {
      baseMessagesCount: baseMessages.length,
      hasTodos: !!todoCallMessage,
      hasStoredValues: !!(
        storedValuesResults && inputData['extract-values-search'].searchPerformed
      ),
      totalMessagesCount: messages.length,
      messageRoles: messages.map((m) => m.role),
      lastMessage: messages[messages.length - 1],
    });

    // Update chunk processor with initial messages
    chunkProcessor.setInitialMessages(messages);

    // Main execution loop with retry logic
    while (retryCount <= maxRetries) {
      try {
        console.info('Think and Prep: Starting stream attempt', {
          retryCount,
          messagesCount: messages.length,
          messageRoles: messages.map((m) => m.role),
          hasHealingMessage: messages.some(
            (m) =>
              m.role === 'user' &&
              typeof m.content === 'string' &&
              m.content.includes('I encountered an error')
          ),
          hasToolResultHealing: messages.some(
            (m) =>
              m.role === 'tool' &&
              Array.isArray(m.content) &&
              m.content.some(
                (c) =>
                  typeof c === 'object' &&
                  'type' in c &&
                  c.type === 'tool-result' &&
                  'result' in c &&
                  c.result !== null &&
                  typeof c.result === 'object' &&
                  'error' in c.result
              )
          ),
        });

        const wrappedStream = wrapTraced(
          async () => {
            // Create stream directly without retryableAgentStreamWithHealing
            const stream = await thinkAndPrepAgent.stream(messages, {
              toolCallStreaming: true,
              runtimeContext,
              maxRetries: 5,
              abortSignal: abortController.signal,
              toolChoice: 'required',
              onChunk: createOnChunkHandler({
                chunkProcessor,
                abortController,
                finishingToolNames: [
                  'submitThoughts',
                  'respondWithoutAnalysis',
                  'messageUserClarifyingQuestion',
                ],
                onFinishingTool: () => {
                  // Set finished = true for respondWithoutAnalysis and messageUserClarifyingQuestion
                  // submitThoughts should abort but not finish so workflow can continue
                  const finishingToolName = chunkProcessor.getFinishingToolName();
                  if (
                    finishingToolName === 'respondWithoutAnalysis' ||
                    finishingToolName === 'messageUserClarifyingQuestion'
                  ) {
                    finished = true;
                  }
                },
              }),
              onError: async (event: { error: unknown }) => {
                const error = event.error;
                console.error('Think and Prep stream error caught in onError:', error);

                // Check if max retries reached
                if (retryCount >= maxRetries) {
                  console.error('Think and Prep onError: Max retries reached', {
                    retryCount,
                    maxRetries,
                  });
                  return; // Let the error propagate normally
                }

                // Check if this error has a specific healing strategy
                const workflowContext: WorkflowContext = {
                  currentStep: 'think-and-prep',
                };
                const retryableError = detectRetryableError(error, workflowContext);

                if (retryableError?.healingMessage) {
                  console.info('Think and Prep onError: Setting up retry with specific healing', {
                    retryCount: retryCount + 1,
                    maxRetries,
                    errorType: retryableError.type,
                    healingMessage: retryableError.healingMessage,
                  });

                  // Throw a special error with the healing info
                  throw new RetryWithHealingError(retryableError);
                }

                // For all other errors, create a generic healing message
                console.info(
                  'Think and Prep onError: Setting up retry with generic healing message',
                  {
                    retryCount: retryCount + 1,
                    maxRetries,
                    errorMessage: error instanceof Error ? error.message : String(error),
                  }
                );

                // Extract detailed error information
                let detailedErrorMessage = '';

                if (error instanceof Error) {
                  detailedErrorMessage = error.message;

                  // Check for Zod validation errors in the cause
                  if (
                    'cause' in error &&
                    error.cause &&
                    typeof error.cause === 'object' &&
                    'errors' in error.cause
                  ) {
                    const zodError = error.cause as {
                      errors: Array<{ path: Array<string | number>; message: string }>;
                    };
                    const validationDetails = zodError.errors
                      .map((e) => `${e.path.join('.')}: ${e.message}`)
                      .join('; ');
                    detailedErrorMessage = `${error.message} - Validation errors: ${validationDetails}`;
                  }

                  // Check for status code (API errors)
                  if ('statusCode' in error && error.statusCode) {
                    detailedErrorMessage = `${detailedErrorMessage} (Status: ${error.statusCode})`;
                  }

                  // Check for response body (API errors)
                  if ('responseBody' in error && error.responseBody) {
                    const body =
                      typeof error.responseBody === 'string'
                        ? error.responseBody
                        : JSON.stringify(error.responseBody);
                    detailedErrorMessage = `${detailedErrorMessage} - Response: ${body.substring(0, 200)}`;
                  }

                  // Check for tool-specific information
                  if ('toolName' in error && error.toolName) {
                    detailedErrorMessage = `${detailedErrorMessage} (Tool: ${error.toolName})`;
                  }

                  // Check for available tools (NoSuchToolError that wasn't caught)
                  if ('availableTools' in error && Array.isArray(error.availableTools)) {
                    detailedErrorMessage = `${detailedErrorMessage} - Available tools: ${error.availableTools.join(', ')}`;
                  }
                } else {
                  detailedErrorMessage = String(error);
                }

                // Create a generic user message with the detailed error information
                const genericHealingMessage: CoreMessage = {
                  role: 'user',
                  content: `I encountered an error while processing your request: "${detailedErrorMessage}". Please continue with the analysis, working around this issue if possible. If this is a tool-related error, please use only the available tools for the current step.`,
                };

                // Create a generic retryable error with the healing message
                const genericRetryableError: RetryableError = {
                  type: 'unknown-error',
                  healingMessage: genericHealingMessage,
                  originalError: error,
                };

                // Throw with healing info
                throw new RetryWithHealingError(genericRetryableError);
              },
            });

            return stream;
          },
          {
            name: 'Think and Prep',
            spanAttributes: {
              messageCount: messages.length,
              retryAttempt: retryCount,
            },
          }
        );

        const stream = await wrappedStream();

        // Process the stream - chunks are handled by onChunk callback
        for await (const _chunk of stream.fullStream) {
          // Stream is being processed via onChunk callback
          // This loop just ensures the stream completes
          if (abortController.signal.aborted) {
            break;
          }
        }

        console.info('Think and Prep: Stream completed successfully');
        break; // Exit the retry loop on success
      } catch (error) {
        console.error('Think and Prep: Error in stream processing', error);

        // Handle normal AbortError (from submitThoughts, etc)
        if (error instanceof Error && error.name === 'AbortError') {
          console.info('Think and Prep: Stream aborted successfully (normal completion)');
          break; // Normal abort, exit retry loop
        }

        // Handle our retry error with healing (all errors now have healing)
        if (isRetryWithHealingError(error)) {
          const retryableError = error.retryableError;

          // Get the current messages from chunk processor to find the failed tool call
          const currentMessages = chunkProcessor.getAccumulatedMessages();
          const healingMessage = retryableError.healingMessage;
          let insertionIndex = currentMessages.length; // Default to end

          // If this is a NoSuchToolError, find the correct position to insert the healing message
          if (retryableError.type === 'no-such-tool' && Array.isArray(healingMessage.content)) {
            const firstContent = healingMessage.content[0];
            if (
              firstContent &&
              typeof firstContent === 'object' &&
              'type' in firstContent &&
              firstContent.type === 'tool-result' &&
              'toolCallId' in firstContent &&
              'toolName' in firstContent
            ) {
              // Find the assistant message with the failed tool call
              for (let i = currentMessages.length - 1; i >= 0; i--) {
                const msg = currentMessages[i];
                if (msg && msg.role === 'assistant' && Array.isArray(msg.content)) {
                  // Find tool calls in this message
                  const toolCalls = msg.content.filter(
                    (
                      c
                    ): c is {
                      type: 'tool-call';
                      toolCallId: string;
                      toolName: string;
                      args: unknown;
                    } =>
                      typeof c === 'object' &&
                      c !== null &&
                      'type' in c &&
                      c.type === 'tool-call' &&
                      'toolCallId' in c &&
                      'toolName' in c &&
                      'args' in c
                  );

                  // Check each tool call to see if it matches and has no result
                  for (const toolCall of toolCalls) {
                    // Check if this tool call matches the failed tool name
                    if (toolCall.toolName === firstContent.toolName) {
                      // Look ahead for tool results
                      let hasResult = false;
                      for (let j = i + 1; j < currentMessages.length; j++) {
                        const nextMsg = currentMessages[j];
                        if (nextMsg && nextMsg.role === 'tool' && Array.isArray(nextMsg.content)) {
                          const hasMatchingResult = nextMsg.content.some(
                            (c) =>
                              typeof c === 'object' &&
                              c !== null &&
                              'type' in c &&
                              c.type === 'tool-result' &&
                              'toolCallId' in c &&
                              c.toolCallId === toolCall.toolCallId
                          );
                          if (hasMatchingResult) {
                            hasResult = true;
                            break;
                          }
                        }
                      }

                      // If this tool call has no result, this is our failed call
                      if (!hasResult) {
                        console.info(
                          'Think and Prep: Found orphaned tool call, using its ID for healing',
                          {
                            toolCallId: toolCall.toolCallId,
                            toolName: toolCall.toolName,
                            atIndex: i,
                          }
                        );

                        // Update the healing message with the correct toolCallId
                        firstContent.toolCallId = toolCall.toolCallId;

                        // Insert position is right after this assistant message
                        insertionIndex = i + 1;
                        break;
                      }
                    }
                  }

                  // If we found the position, stop searching
                  if (insertionIndex !== currentMessages.length) break;
                }
              }
            }
          }

          // Apply exponential backoff for all retries
          const backoffDelay = Math.min(1000 * 2 ** retryCount, 10000); // Max 10 seconds
          console.info('Think and Prep: Retrying with healing message after backoff', {
            retryCount,
            errorType: retryableError.type,
            insertionIndex,
            totalMessages: currentMessages.length,
            backoffDelay,
            healingMessageRole: healingMessage.role,
            healingMessageContent: healingMessage.content,
          });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));

          // Create new messages array with healing message inserted at the correct position
          const updatedMessages = [
            ...currentMessages.slice(0, insertionIndex),
            healingMessage,
            ...currentMessages.slice(insertionIndex),
          ];

          console.info('Think and Prep: Messages after healing insertion', {
            originalCount: currentMessages.length,
            updatedCount: updatedMessages.length,
            insertionIndex,
            healingMessageIndex: updatedMessages.findIndex((m) => m === healingMessage),
            lastThreeMessages: updatedMessages.slice(-3).map((m) => ({
              role: m.role,
              content:
                typeof m.content === 'string'
                  ? m.content.substring(0, 100)
                  : Array.isArray(m.content)
                    ? m.content[0]
                    : m.content,
            })),
          });

          // Update messages for the retry
          messages = updatedMessages;

          // Instead of resetting, append just the healing message at the correct position
          if (insertionIndex === currentMessages.length) {
            // Healing message goes at the end - simple append
            chunkProcessor.appendMessages([healingMessage]);
          } else {
            // Healing message needs to be inserted in the middle
            // We need to reset and rebuild to maintain order
            chunkProcessor.setInitialMessages(updatedMessages);
          }

          // Force save to persist the healing message immediately
          await chunkProcessor.saveToDatabase();

          retryCount++;

          // Continue to next retry iteration
          continue;
        }

        // If we've exhausted retries or it's an unexpected error at this point
        if (retryCount >= maxRetries) {
          console.error('Think and Prep: Max retries exhausted', {
            retryCount,
            maxRetries,
            errorName: error instanceof Error ? error.name : 'unknown',
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        }

        // Check if it's a database connection error
        if (error instanceof Error && error.message.includes('DATABASE_URL')) {
          throw new Error('Unable to connect to the analysis service. Please try again later.');
        }

        // Check if it's an API/model error
        if (
          error instanceof Error &&
          (error.message.includes('API') || error.message.includes('model'))
        ) {
          throw new Error(
            'The analysis service is temporarily unavailable. Please try again in a few moments.'
          );
        }

        // For unexpected errors, provide a generic friendly message
        throw new Error(
          'Something went wrong during the analysis. Please try again or contact support if the issue persists.'
        );
      }
    }

    // Get final results from chunk processor
    completeConversationHistory = chunkProcessor.getAccumulatedMessages();
    outputMessages = extractMessageHistory(completeConversationHistory);

    // DEBUG: Log what we're passing to analyst step
    console.info('[Think and Prep Step] Creating result:', {
      finished,
      outputMessagesCount: outputMessages.length,
      reasoningHistoryCount: chunkProcessor.getReasoningHistory().length,
      responseHistoryCount: chunkProcessor.getResponseHistory().length,
      dashboardFilesProvided: dashboardFiles !== undefined,
      dashboardFilesCount: dashboardFiles?.length || 0,
      dashboardFiles: dashboardFiles,
    });

    const result = createStepResult(
      finished,
      outputMessages,
      finalStepData,
      chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
      chunkProcessor.getResponseHistory() as BusterChatMessageResponse[],
      dashboardFiles // Pass dashboard context through
    );

    return result;
  } catch (error) {
    // Only return a result for AbortError (which is expected when tools finish)
    if (error instanceof Error && error.name === 'AbortError') {
      // Get final results from chunk processor
      completeConversationHistory = chunkProcessor.getAccumulatedMessages();
      outputMessages = extractMessageHistory(completeConversationHistory);

      return createStepResult(
        finished,
        outputMessages,
        finalStepData,
        chunkProcessor.getReasoningHistory() as BusterChatMessageReasoning[],
        chunkProcessor.getResponseHistory() as BusterChatMessageResponse[],
        dashboardFiles // Pass dashboard context through
      );
    }

    // For other errors, re-throw them (they should have been handled in the retry loop)
    throw error;
  }
};

export const thinkAndPrepStep = createStep({
  id: 'think-and-prep',
  description:
    'This step runs the think and prep agent to analyze the prompt and prepare thoughts.',
  inputSchema,
  outputSchema,
  execute: thinkAndPrepExecution,
});
