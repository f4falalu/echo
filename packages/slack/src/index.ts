// Types
export * from './types';
export * from './types/errors';
export * from './types/webhooks';

// Schemas for validation (useful with zValidator)
export {
  urlVerificationSchema,
  slackRequestHeadersSchema,
  appMentionEventSchema,
  eventCallbackSchema,
  slackEventEnvelopeSchema,
  slackWebhookPayloadSchema,
} from './types/webhooks';

// Services
export { SlackAuthService } from './services/auth';
export { SlackChannelService } from './services/channels';
export { SlackMessagingService } from './services/messaging';
export { SlackUserService, type SlackUser, type SlackUserInfoResponse } from './services/users';
export {
  verifySlackRequest,
  handleUrlVerification,
  parseSlackWebhookPayload,
  getRawBody,
} from './services/webhook-verification';

// Interfaces
export type {
  ISlackTokenStorage,
  ISlackOAuthStateStorage,
  SlackOAuthStateData,
} from './interfaces/token-storage';
export { SlackOAuthStateDataSchema } from './interfaces/token-storage';
export type { ISlackMessageTracking, MessageTrackingData } from './interfaces/message-tracking';
export { MessageTrackingDataSchema } from './interfaces/message-tracking';

// Utils
export * from './utils/validation-helpers';
export * from './utils/message-formatter';
export * from './utils/oauth-helpers';
export { convertMarkdownToSlack } from './utils/markdown-to-slack';

// Reactions
export { addReaction, removeReaction, getReactions } from './reactions';

// Threads
export {
  getThreadMessages,
  getMessage,
  getThreadReplyCount,
  formatThreadMessages,
  type SlackMessage,
} from './threads';

// Version
export const VERSION = '1.0.0';
