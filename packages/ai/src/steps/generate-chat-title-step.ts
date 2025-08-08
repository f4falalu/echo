import { updateChat, updateMessage } from '@buster/database';
import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Haiku35 } from '../models/haiku-3-5';

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  title: z.string().describe('The title for the chat.'),
});

const generateChatTitleInstructions = `
I am a chat title generator that is responsible for generating a title for the chat.

The title should be 3-8 words, capturing the main topic or intent of the conversation. 
With an emphasis on the user's question and most recent converstaion topic.
`;

export interface GenerateChatTitleParams {
  prompt: string;
  conversationHistory?: ModelMessage[];
  chatId?: string;
  messageId?: string;
}

export interface GenerateChatTitleResult {
  title: string;
}

/**
 * Generates a title using the LLM with conversation context
 */
async function generateTitleWithLLM(
  prompt: string,
  conversationHistory?: ModelMessage[]
): Promise<string> {
  try {
    // Prepare messages for the LLM
    const messages: ModelMessage[] = [];

    // Add system message
    messages.push({
      role: 'system',
      content: generateChatTitleInstructions,
    });

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory);
    }

    // Add the current user prompt
    messages.push({
      role: 'user',
      content: prompt,
    });

    const tracedChatTitle = wrapTraced(
      async () => {
        const { object } = await generateObject({
          model: Haiku35,
          schema: llmOutputSchema,
          messages,
        });

        return object;
      },
      {
        name: 'Generate Chat Title',
      }
    );

    const result = await tracedChatTitle();
    return result.title ?? 'New Analysis';
  } catch (llmError) {
    // Handle LLM generation errors specifically
    console.warn('[GenerateChatTitle] LLM failed to generate valid response:', {
      error: llmError instanceof Error ? llmError.message : 'Unknown error',
      errorType: llmError instanceof Error ? llmError.name : 'Unknown',
    });

    // Continue with fallback title instead of failing
    return 'New Analysis';
  }
}

/**
 * Updates database records with the generated title
 */
async function updateDatabaseRecords(
  title: string,
  chatId?: string,
  messageId?: string
): Promise<void> {
  const updatePromises: Promise<{ success: boolean }>[] = [];

  if (chatId) {
    updatePromises.push(
      updateChat(chatId, {
        title,
      })
    );
  }

  if (messageId) {
    updatePromises.push(
      updateMessage(messageId, {
        title,
      })
    );
  }

  await Promise.all(updatePromises);
}

export async function generateChatTitle({
  prompt,
  conversationHistory,
  chatId,
  messageId,
}: GenerateChatTitleParams): Promise<GenerateChatTitleResult> {
  try {
    // Generate title using LLM
    const title = await generateTitleWithLLM(prompt, conversationHistory);

    // Update database records with the generated title
    await updateDatabaseRecords(title, chatId, messageId);

    return { title };
  } catch (error) {
    // Handle AbortError gracefully
    if (error instanceof Error && error.name === 'AbortError') {
      // Return a fallback title when aborted
      return { title: 'New Analysis' };
    }

    console.error('[GenerateChatTitle] Failed to generate chat title:', error);
    // Return a fallback title instead of crashing
    return { title: 'New Analysis' };
  }
}
