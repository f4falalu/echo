import type { ShareRole } from '@/api/asset_interfaces/share';

/**
 * Type defining the sharing permissions and settings for a dashboard
 *
 * @interface ShareRequest
 */
export type ShareRequest = {
  /** The unique identifier of the dashboard */
  id: string;
  /** User-specific permissions array */
  user_permissions?: {
    /** Email of the user to grant permissions to */
    user_email: string;
    /** Role to assign to the user */
    role: ShareRole;
  }[];
  /** Array of user IDs to remove access from */
  remove_users?: string[];
  /** Team-specific permissions array */
  team_permissions?: {
    /** ID of the team to grant permissions to */
    team_id: string;
    /** Role to assign to the team */
    role: ShareRole;
  }[];
  /** Array of team IDs to remove access from */
  remove_teams?: string[];
  /** Whether the dashboard is publicly accessible */
  publicly_accessible?: boolean;
  /** Optional password for public access */
  public_password?: string | null;
  /** Optional expiration date for public access (timestamptz) */
  public_expiry_date?: string | null;
};
