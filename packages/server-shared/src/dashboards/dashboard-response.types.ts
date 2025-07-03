import type { Metric } from '../metrics';
import type { ShareConfig, ShareRole } from '../share';
import type { Dashboard } from './dashboard.types';

export type BusterDashboardResponse = {
  access: ShareRole;
  metrics: Record<string, Metric>;
  dashboard: Dashboard;
  permission: ShareRole;
  public_password: string | null;
  collections: {
    id: string;
    name: string;
  }[];
  versions: {
    version_number: number;
    updated_at: string;
  }[];
} & ShareConfig;
