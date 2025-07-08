import type { VerificationStatus } from '../share';

export type DashboardListItem = {
  created_at: string;
  id: string;
  last_edited: string;
  members: {
    avatar_url: string | null;
    id: string;
    name: string;
  }[];
  name: string;
  owner: {
    avatar_url: string | null;
    id: string;
    name: string;
  };
  status: VerificationStatus;
  is_shared: boolean;
};
