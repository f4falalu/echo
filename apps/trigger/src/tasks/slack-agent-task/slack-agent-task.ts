import { type TaskOutput, logger, schemaTask } from '@trigger.dev/sdk';
import { z } from 'zod';
import {
  createMessageAndTriggerAnalysis,
  getChatDetails,
  getOrganizationSlackIntegration,
} from './helpers';
import { addReaction, removeReaction, getReactions, getThreadMessages } from '@buster/slack';

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
      });

      // Step 2: Get Slack integration for access token
      const { integration, accessToken } = await getOrganizationSlackIntegration(
        chatDetails.organizationId
      );

      logger.log('Retrieved Slack integration', {
        organizationId: chatDetails.organizationId,
        teamId: integration.teamId,
        teamName: integration.teamName,
        botUserId: integration.botUserId,
      });

      // Step 3: Add hourglass reaction (and remove any existing bot reactions)
      try {
        // First, get existing reactions to see if we need to clean up
        const existingReactions = await getReactions({
          accessToken,
          channelId: chatDetails.slackChannelId,
          messageTs: chatDetails.slackThreadTs,
        });

        // Remove any existing reactions from the bot
        if (integration.botUserId && existingReactions.length > 0) {
          const botReactions = existingReactions.filter(
            reaction => reaction.users.includes(integration.botUserId!)
          );
          
          for (const reaction of botReactions) {
            try {
              await removeReaction({
                accessToken,
                channelId: chatDetails.slackChannelId,
                messageTs: chatDetails.slackThreadTs,
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
          messageTs: chatDetails.slackThreadTs,
          emoji: 'hourglass_flowing_sand',
        });
        
        logger.log('Added hourglass reaction to Slack thread');
      } catch (error) {
        // Log but don't fail the entire task if reaction handling fails
        logger.warn('Failed to manage Slack reactions', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

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

      // TODO: Process slack messages to generate prompt
      const prompt = 'TODO: Generate from slack conversation';

      // Step 5: Create message and trigger analyst agent
      const { message, triggerRunId } = await createMessageAndTriggerAnalysis({
        chatId: payload.chatId,
        userId: payload.userId,
        content: prompt,
      });

      logger.log('Successfully created message and triggered analyst agent', {
        chatId: payload.chatId,
        messageId: message.id,
        triggerRunId,
      });

      return {
        success: true,
        messageId: message.id,
        triggerRunId,
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
