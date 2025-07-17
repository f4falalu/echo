import type { ShareRole, WorkspaceShareRole } from '@buster/server-shared/share';

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
