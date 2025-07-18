import type { ShareRole } from '@buster/server-shared/share';

export type ShareDeleteRequest = string[];

export type ShareUpdateRequest = {
  users?: {
    email: string;
    role: ShareRole;
  }[];
  publicly_accessible?: boolean;
  public_password?: string | null;
  public_expiry_date?: string | null;
};
