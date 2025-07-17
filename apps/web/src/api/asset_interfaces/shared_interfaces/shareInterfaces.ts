import type { ShareRole, WorkspaceShareRole } from '@buster/server-shared/share';

/**
 * Type defining the sharing permissions and settings for a dashboard
 *
 * @interface ShareRequest
 */
export type SharePostRequest = {
  email: string;
  role: ShareRole;
  avatar_url?: string | null;
  name?: string | undefined;
}[];

export type ShareDeleteRequest = string[];

export type ShareUpdateRequest = {
  users?: {
    email: string;
    role: ShareRole;
  }[];
  workspace_sharing?: WorkspaceShareRole | null;
  publicly_accessible?: boolean;
  public_password?: string | null;
  public_expiry_date?: string | null;
};
