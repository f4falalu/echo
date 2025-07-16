import {
  SlackMessagingService,
  addReaction,
  getReactions,
  getThreadMessages,
  removeReaction,
} from '@buster/slack';
import { type TaskOutput, logger, runs, schemaTask, wait } from '@trigger.dev/sdk';
import { z } from 'zod';
import { analystAgentTask } from '../analyst-agent-task/analyst-agent-task';
import {
  createMessage,
  filterMessagesAfterLastMention,
  getChatDetails,
  getOrganizationSlackIntegration,
} from './helpers';

const SlackAgentTaskInputSchema = z.object({
  chatId: z.string().uuid(),
  userId: z.string().uuid(),
});

const SlackAgentTaskOutputSchema = z.object({
  success: z.boolean(),
  messageId: z.string().uuid(),
  triggerRunId: z.string(),
});

export type SlackAgentTaskInput = z.infer<typeof SlackAgentTaskInputSchema>;
export type SlackAgentTaskOutput = z.infer<typeof SlackAgentTaskOutputSchema>;

export const slackAgentTask: ReturnType<
  typeof schemaTask<'slack-agent-task', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>
> = schemaTask<'slack-agent-task', typeof SlackAgentTaskInputSchema, SlackAgentTaskOutput>({
  id: 'slack-agent-task',
  schema: SlackAgentTaskInputSchema,
  maxDuration: 300, // 300 seconds timeout
  run: async (payload: SlackAgentTaskInput): Promise<SlackAgentTaskOutput> => {
    try {
      logger.log('Starting Slack agent task', {
        chatId: payload.chatId,
        userId: payload.userId,
      });

      // Step 1: Get chat details first (we need this for everything else)
      const chatDetails = await getChatDetails(payload.chatId);

      if (!chatDetails.slackChannelId || !chatDetails.slackThreadTs) {
        throw new Error('Chat is missing Slack channel or thread information');
      }

      logger.log('Retrieved chat details', {
        chatId: payload.chatId,
        organizationId: chatDetails.organizationId,
        slackChannelId: chatDetails.slackChannelId,
        slackThreadTs: chatDetails.slackThreadTs,
        slackChatAuthorization: chatDetails.chat.slackChatAuthorization,
      });

      // Step 2: Get Slack integration for access token
      const { integration, accessToken } = await getOrganizationSlackIntegration(
        chatDetails.organizationId
      );

      // Check if user is unauthorized
      if (chatDetails.chat.slackChatAuthorization === 'unauthorized') {
        logger.log('User is unauthorized, sending message to Slack thread');

        const messagingService = new SlackMessagingService();
        const unauthorizedMessage = {
          text: "It looks like you haven't been added to this Buster workspace. One of your workspace admins will need to add you before you can send requests.",
          thread_ts: chatDetails.slackThreadTs,
        };

        try {
          await messagingService.sendMessage(
            accessToken,
            chatDetails.slackChannelId,
            unauthorizedMessage
          );
          logger.log('Sent unauthorized message to Slack thread');
        } catch (error) {
          logger.error('Failed to send unauthorized message to Slack', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Return early - don't process the request
        return {
          success: false,
          messageId: '',
          triggerRunId: '',
        };
      }

      logger.log('Retrieved Slack integration', {
        organizationId: chatDetails.organizationId,
        teamId: integration.teamId,
        teamName: integration.teamName,
        botUserId: integration.botUserId,
      });

      // Step 3: We'll add reactions after we fetch messages and find the mention

      // Step 4: Fetch all needed data concurrently
      const [slackMessages] = await Promise.all([
        getThreadMessages({
          accessToken,
          channelId: chatDetails.slackChannelId,
          threadTs: chatDetails.slackThreadTs,
        }),
        // Add more concurrent fetches here if needed
      ]);

      logger.log('Retrieved Slack thread messages', {
        messageCount: slackMessages.length,
        hasParentMessage: slackMessages.length > 0,
      });

      // Filter messages to only include non-bot messages after the most recent app mention
      if (!integration.botUserId) {
        logger.error('No bot user ID found for Slack integration');
        throw new Error('Slack integration is missing bot user ID');
      }

      const { filteredMessages: relevantMessages, mentionMessageTs } =
        filterMessagesAfterLastMention(slackMessages, integration.botUserId);

      logger.log('Filtered relevant messages', {
        originalCount: slackMessages.length,
        filteredCount: relevantMessages.length,
        botUserId: integration.botUserId,
        mentionMessageTs,
      });

      // If no mention was found, we can't proceed
      if (!mentionMessageTs) {
        logger.error('No @Buster mention found in thread');
        throw new Error('No @Buster mention found in the thread');
      }

      // Step 5: Add hourglass reaction to the message that mentioned @Buster
      try {
        // First, get existing reactions to see if we need to clean up
        const existingReactions = await getReactions({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: mentionMessageTs,
        });

        // Remove any existing reactions from the bot
        if (integration.botUserId && existingReactions.length > 0) {
          const botUserId = integration.botUserId;
          const botReactions = existingReactions.filter((reaction) =>
            reaction.users.includes(botUserId)
          );

          for (const reaction of botReactions) {
            try {
              await removeReaction({
                accessToken,
                channelId: chatDetails.slackChannelId,
                messageTs: mentionMessageTs,
                emoji: reaction.name,
              });
              logger.log('Removed existing bot reaction', { emoji: reaction.name });
            } catch (error) {
              // Log but don't fail if we can't remove a reaction
              logger.warn('Failed to remove bot reaction', {
                emoji: reaction.name,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }
        }

        // Add the hourglass reaction
        await addReaction({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: mentionMessageTs,
          emoji: 'hourglass_flowing_sand',
        });

        logger.log('Added hourglass reaction to message with @Buster mention', {
          messageTs: mentionMessageTs,
        });
      } catch (error) {
        // Log but don't fail the entire task if reaction handling fails
        logger.warn('Failed to manage Slack reactions', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Generate prompt from the filtered messages
      const prompt =
        relevantMessages
          .map((msg) => msg.text || '')
          .filter((text) => text.trim() !== '')
          .join(' ')
          .trim() || 'who is my top customer?'; // Fallback if no messages found

      // Step 6: Create message
      const message = await createMessage({
        chatId: payload.chatId,
        userId: payload.userId,
        content: prompt,
      });

      logger.log('Successfully created message', {
        chatId: payload.chatId,
        messageId: message.id,
      });

      // Step 7: Trigger analyst agent task (without waiting)
      logger.log('Triggering analyst agent task', {
        messageId: message.id,
      });

      const analystHandle = await analystAgentTask.trigger({
        message_id: message.id,
      });

      logger.log('Analyst agent task triggered', {
        runId: analystHandle.id,
      });

      // Step 8: Send initial Slack message immediately after triggering
      const messagingService = new SlackMessagingService();
      const busterUrl = process.env.BUSTER_URL || 'https://platform.buster.so';

      try {
        const progressMessage = {
          text: `I've started working on your request! You can view it here: ${busterUrl}/app/chats/${payload.chatId}`,
          thread_ts: chatDetails.slackThreadTs,
        };

        await messagingService.sendMessage(
          accessToken,
          chatDetails.slackChannelId,
          progressMessage
        );

        logger.log('Sent progress message to Slack thread');
      } catch (error) {
        // Log but don't fail the task if we can't send the progress message
        logger.warn('Failed to send progress message to Slack', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Step 9: Poll for analyst task completion
      let isComplete = false;
      let analystResult: { ok: boolean; output?: unknown; error?: unknown } | null = null;
      const maxPollingTime = 30 * 60 * 1000; // 30 minutes
      const pollingInterval = 5000; // 5 seconds
      const startTime = Date.now();

      while (!isComplete && Date.now() - startTime < maxPollingTime) {
        await wait.for({ seconds: pollingInterval / 1000 });

        try {
          const run = await runs.retrieve(analystHandle.id);

          logger.log('Polling analyst task status', {
            runId: analystHandle.id,
            status: run.status,
          });

          if (run.status === 'COMPLETED') {
            isComplete = true;
            analystResult = { ok: true, output: run.output };
          } else if (
            run.status === 'SYSTEM_FAILURE' ||
            run.status === 'CRASHED' ||
            run.status === 'CANCELED' ||
            run.status === 'TIMED_OUT' ||
            run.status === 'INTERRUPTED'
          ) {
            isComplete = true;
            analystResult = { ok: false, error: run.error || 'Task failed' };
          }
        } catch (error) {
          logger.warn('Failed to retrieve run status', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Check if we timed out
      if (!isComplete) {
        logger.error('Analyst task polling timed out');
        analystResult = { ok: false, error: 'Task timed out' };
      }

      // Handle analyst task result
      if (!analystResult || !analystResult.ok) {
        // If analyst task failed, notify the user
        logger.error('Analyst agent task failed', {
          error: analystResult?.error || 'Unknown error',
        });

        try {
          await messagingService.sendMessage(accessToken, chatDetails.slackChannelId, {
            text: `Sorry, I encountered an error while processing your request. Please try again or contact support if the issue persists.`,
            thread_ts: chatDetails.slackThreadTs,
          });
        } catch (error) {
          logger.warn('Failed to send error message to Slack', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        throw new Error(
          `Analyst agent task failed: ${JSON.stringify(analystResult?.error || 'Unknown error')}`
        );
      }

      // Step 10: Update reactions - remove hourglass, add checkmark on the mention message
      try {
        // Remove the hourglass reaction
        await removeReaction({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: mentionMessageTs,
          emoji: 'hourglass_flowing_sand',
        });

        // Add the checkmark reaction
        await addReaction({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: mentionMessageTs,
          emoji: 'white_check_mark',
        });

        logger.log('Updated Slack reactions on mention message', {
          messageTs: mentionMessageTs,
        });
      } catch (error) {
        logger.warn('Failed to update Slack reactions', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Step 11: Send completion message
      try {
        const completionMessage = {
          text: `I've finished working on your request!`,
          thread_ts: chatDetails.slackThreadTs,
        };

        await messagingService.sendMessage(
          accessToken,
          chatDetails.slackChannelId,
          completionMessage
        );

        logger.log('Sent completion message to Slack thread');
      } catch (error) {
        logger.warn('Failed to send completion message to Slack', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      return {
        success: true,
        messageId: message.id,
        triggerRunId: analystHandle.id,
      };
    } catch (error) {
      logger.error('Failed to process Slack agent task', {
        chatId: payload.chatId,
        userId: payload.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  },
});
