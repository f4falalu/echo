import type { BusterShare, ShareRole, VerificationStatus } from '../share';
import type { BusterMetric } from '../metric';
import type { DashboardConfig } from './dashboardConfigInterfaces';

export interface BusterDashboardListItem {
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
}

export interface BusterDashboardResponse extends BusterShare {
  access: ShareRole;
  metrics: BusterMetric[];
  dashboard: BusterDashboard;
  permission: ShareRole;
  public_password: string | null;
}

export interface BusterDashboard
  extends Omit<
    BusterShare,
    'team_permissions' | 'organization_permissions' | 'individual_permissions' | 'permission'
  > {
  config: DashboardConfig;
  created_at: string;
  created_by: string;
  deleted_at: string | null;
  description: string | null;
  id: string;
  name: string;
  updated_at: string | null;
  updated_by: string;
  status: VerificationStatus;
}
