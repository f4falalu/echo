import { z } from 'zod';

// Slack integration status enum
export const SlackIntegrationStatusSchema = z.enum(['pending', 'active', 'failed', 'revoked']);
export type SlackIntegrationStatus = z.infer<typeof SlackIntegrationStatusSchema>;

// Slack chat authorization enum
export const SlackChatAuthorizationSchema = z.enum(['unauthorized', 'authorized', 'auto_added']);
export type SlackChatAuthorization = z.infer<typeof SlackChatAuthorizationSchema>;

// Slack sharing permission enum
export const SlackSharingPermissionSchema = z.enum([
  'shareWithWorkspace',
  'shareWithChannel',
  'noSharing',
]);
export type SlackSharingPermission = z.infer<typeof SlackSharingPermissionSchema>;
