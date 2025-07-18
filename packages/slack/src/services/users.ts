import { WebClient } from '@slack/web-api';
import { z } from 'zod';
import { SlackIntegrationError } from '../types/errors';
import { validateWithSchema } from '../utils/validation-helpers';

// Zod schemas for Slack user data
const SlackUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  real_name: z.string().optional(),
  profile: z
    .object({
      email: z.string().email().optional(),
      display_name: z.string().optional(),
      real_name: z.string().optional(),
      real_name_normalized: z.string().optional(),
      team: z.string().optional(),
    })
    .optional(),
  is_bot: z.boolean().optional(),
  is_app_user: z.boolean().optional(),
  deleted: z.boolean().optional(),
  team_id: z.string().optional(),
});

const SlackUserInfoResponseSchema = z.object({
  ok: z.boolean(),
  user: SlackUserSchema.optional(),
  error: z.string().optional(),
});

export type SlackUser = z.infer<typeof SlackUserSchema>;
export type SlackUserInfoResponse = z.infer<typeof SlackUserInfoResponseSchema>;

export class SlackUserService {
  private slackClient: WebClient;

  constructor(client?: WebClient) {
    this.slackClient = client || new WebClient();
  }

  /**
   * Fetch user information from Slack by user ID
   * @param accessToken The access token for the Slack workspace
   * @param userId The Slack user ID
   * @returns User information including email
   */
  async getUserInfo(accessToken: string, userId: string): Promise<SlackUser> {
    try {
      const response = await this.slackClient.users.info({
        token: accessToken,
        user: userId,
      });

      const validatedResponse = validateWithSchema(
        SlackUserInfoResponseSchema,
        response,
        'Invalid response from Slack users.info'
      );

      if (!validatedResponse.ok || !validatedResponse.user) {
        throw new SlackIntegrationError(
          'USER_NOT_FOUND',
          `Failed to fetch user info: ${validatedResponse.error || 'User not found'}`,
          false
        );
      }

      return validatedResponse.user;
    } catch (error) {
      if (error instanceof SlackIntegrationError) {
        throw error;
      }

      throw new SlackIntegrationError(
        'NETWORK_ERROR',
        'Failed to fetch user information from Slack',
        true,
        { originalError: error }
      );
    }
  }

  /**
   * Fetch user email from Slack by user ID
   * @param accessToken The access token for the Slack workspace
   * @param userId The Slack user ID
   * @returns User email address
   */
  async getUserEmail(accessToken: string, userId: string): Promise<string> {
    const user = await this.getUserInfo(accessToken, userId);

    if (!user.profile?.email) {
      throw new SlackIntegrationError(
        'EMAIL_NOT_FOUND',
        'User does not have an email address in their Slack profile',
        false
      );
    }

    return user.profile.email;
  }

  /**
   * Check if a user is a bot or app user
   * @param accessToken The access token for the Slack workspace
   * @param userId The Slack user ID
   * @returns true if the user is a bot or app user
   */
  async isBot(accessToken: string, userId: string): Promise<boolean> {
    const user = await this.getUserInfo(accessToken, userId);
    return user.is_bot === true || user.is_app_user === true;
  }

  /**
   * Check if a user is deleted/inactive
   * @param accessToken The access token for the Slack workspace
   * @param userId The Slack user ID
   * @returns true if the user is deleted
   */
  async isDeleted(accessToken: string, userId: string): Promise<boolean> {
    const user = await this.getUserInfo(accessToken, userId);
    return user.deleted === true;
  }
}
