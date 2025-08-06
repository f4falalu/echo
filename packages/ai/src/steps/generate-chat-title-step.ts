import { updateChat, updateMessage } from '@buster/database';
import { generateObject } from 'ai';
import type { ModelMessage } from 'ai';
import { wrapTraced } from 'braintrust';
import { z } from 'zod';
import { Haiku35 } from '../utils/models/haiku-3-5';

// Schema for what the LLM returns
const llmOutputSchema = z.object({
  title: z.string().describe('The title for the chat.'),
});

const generateChatTitleInstructions = `
I am a chat title generator that is responsible for generating a title for the chat.

The title should be 3-8 words, capturing the main topic or intent of the conversation. With an emphasis on the user's question and most recent converstaion topic.
`;

export interface GenerateChatTitleParams {
  prompt: string;
  conversationHistory?: CoreMessage[];
  chatId?: string;
  messageId?: string;
}

export interface GenerateChatTitleResult {
  title: string;
}

export async function generateChatTitle({
  prompt,
  conversationHistory,
  chatId,
  messageId,
}: GenerateChatTitleParams): Promise<GenerateChatTitleResult> {
  try {
    // Prepare messages for the LLM
    let messages: CoreMessage[];
    if (conversationHistory && conversationHistory.length > 0) {
      // Use conversation history as context + append new user message
      messages = appendToConversation(conversationHistory, prompt);
    } else {
      // Otherwise, use just the prompt
      messages = standardizeMessages(prompt);
    }

    let title: { title: string };

    try {
      const tracedChatTitle = wrapTraced(
        async () => {
          const { object } = await generateObject({
            model: Haiku35,
            schema: llmOutputSchema,
            messages: [
              {
                role: 'system',
                content: generateChatTitleInstructions,
              },
              ...messages,
            ],
          });

          return object;
        },
        {
          name: 'Generate Chat Title',
        }
      );

      title = await tracedChatTitle();
    } catch (llmError) {
      // Handle LLM generation errors specifically
      console.warn('[GenerateChatTitle] LLM failed to generate valid response:', {
        error: llmError instanceof Error ? llmError.message : 'Unknown error',
        errorType: llmError instanceof Error ? llmError.name : 'Unknown',
      });

      // Continue with fallback title instead of failing
      title = { title: 'New Analysis' };
    }

    // Run database updates concurrently
    const updatePromises: Promise<{ success: boolean }>[] = [];

    if (chatId) {
      updatePromises.push(
        updateChat(chatId, {
          title: title.title,
        })
      );
    }

    if (messageId) {
      updatePromises.push(
        updateMessage(messageId, {
          title: title.title,
        })
      );
    }

    await Promise.all(updatePromises);

    return { title: title.title };
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
