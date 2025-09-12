import { generateSuggestedMessages } from '@buster/ai';
import {
  DEFAULT_USER_SUGGESTED_PROMPTS,
  type UserSuggestedPromptsType,
  getPermissionedDatasets,
  getUserRecentMessages,
  getUserSuggestedPrompts,
  updateUserSuggestedPrompts,
} from '@buster/database';
import {
  GetSuggestedPromptsRequestSchema,
  type GetSuggestedPromptsResponse,
} from '@buster/server-shared/user';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { standardErrorHandler } from '../../../../../utils/response';

const app = new Hono()
  .get('/', zValidator('param', GetSuggestedPromptsRequestSchema), async (c) => {
    const userId = c.req.param('id');
    const authenticatedUser = c.get('busterUser');

    // Authorization check: Users can only access their own suggested prompts
    if (authenticatedUser.id !== userId) {
      throw new HTTPException(403, {
        message: 'Forbidden: You can only access your own suggested prompts',
      });
    }

    const currentSuggestedPrompts: GetSuggestedPromptsResponse = await getUserSuggestedPrompts({
      userId,
    });

    if (currentSuggestedPrompts) {
      // Check if the updatedAt date is from today
      const today = new Date();
      const updatedDate = new Date(currentSuggestedPrompts.updatedAt);

      const isToday =
        today.getFullYear() === updatedDate.getFullYear() &&
        today.getMonth() === updatedDate.getMonth() &&
        today.getDate() === updatedDate.getDate();

      if (isToday) {
        return c.json(currentSuggestedPrompts);
      }
    }

    const timeoutMs = 10000; // 10 seconds timeout

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout after 10 seconds. Returning current suggested prompts.'));
      }, timeoutMs);
    });

    try {
      const newPrompts: GetSuggestedPromptsResponse = await Promise.race([
        buildNewSuggestedPrompts(userId),
        timeoutPromise,
      ]);
      return c.json(newPrompts);
    } catch {
      if (currentSuggestedPrompts) {
        return c.json(currentSuggestedPrompts);
      }
      const defaultPrompts: GetSuggestedPromptsResponse = DEFAULT_USER_SUGGESTED_PROMPTS;
      return c.json(defaultPrompts);
    }
  })
  .onError(standardErrorHandler);

/**
 * Generate new suggested prompts for a user and update the database with the new prompts
 * Returns the updated prompts
 */
async function buildNewSuggestedPrompts(userId: string): Promise<UserSuggestedPromptsType> {
  try {
    const [databaseContext, chatHistoryText] = await Promise.all([
      getDatabaseContext(userId),
      getUserChatHistoryText(userId),
    ]);

    if (!databaseContext || !chatHistoryText) {
      throw new Error('Either no database context or chat history returned.');
    }

    const generatedPrompts = await generateSuggestedMessages({
      chatHistoryText,
      databaseContext,
      userId,
    });

    const updatedPrompts = await updateUserSuggestedPrompts({
      userId,
      suggestedPrompts: generatedPrompts,
    });

    return updatedPrompts;
  } catch (error) {
    console.error('[GET SuggestedPrompts] Error building new suggested prompts:', error);
    throw error;
  }
}

/**
 * Get database context for a user by fetching their permissioned datasets
 * Returns formatted YAML content from datasets the user has access to
 */
async function getDatabaseContext(userId: string): Promise<string> {
  console.info('[GET SuggestedPrompts] Getting database context for user:', userId);

  try {
    const { datasets } = await getPermissionedDatasets({
      userId,
      pageSize: 1000,
      page: 0,
    });

    if (datasets.length === 0) {
      return '';
    }

    // Filter datasets that have YAML content and format them
    const datasetsWithYaml = datasets
      .filter((dataset) => dataset.ymlContent?.trim())
      .map((dataset) => dataset.ymlContent)
      .join('\n\n---\n\n');

    if (!datasetsWithYaml) {
      return '';
    }

    return datasetsWithYaml;
  } catch (error) {
    console.error('[GET SuggestedPrompts] Error fetching database context:', error);
    return '';
  }
}

/**
 * Format chat history messages into text format for AI processing
 * Takes raw message data and formats as: userMessage: requestMessage, assistantResponses: responseMessages
 */
function formatChatHistoryText(
  messages: Array<{
    requestMessage: string;
    responseMessages: string;
  }>
): string {
  const formattedHistory = messages
    .map((message) => {
      return `userMessage: ${message.requestMessage}, assistantResponses: ${message.responseMessages}`;
    })
    .join('\n\n');

  return formattedHistory;
}

/**
 * Get user's chat history formatted as text for AI processing
 * Fetches recent messages and formats them as requested
 */
async function getUserChatHistoryText(userId: string): Promise<string> {
  const recentMessagesCount = 15;
  try {
    const recentMessages = await getUserRecentMessages(userId, recentMessagesCount);

    if (recentMessages.length === 0) {
      return 'No chat history available, please use the database context to generate general suggestions';
    }

    return formatChatHistoryText(recentMessages);
  } catch (error) {
    console.error('[GET SuggestedPrompts] Error fetching chat history:', error);
    return '';
  }
}

export default app;
