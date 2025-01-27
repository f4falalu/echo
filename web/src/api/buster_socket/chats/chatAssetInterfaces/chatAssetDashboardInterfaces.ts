import type { BusterDashboardMetric } from '../../../buster_rest/dashboards';
import type { DashboardConfig } from '../../dashboards';
import type { FileType } from '../config';

export type BusterDashboardAsset = {
  id: string;
  type: FileType.DASHBOARD;
  metrics: BusterDashboardMetric[];
  config: DashboardConfig;
  created_at: string;
  created_by: string;
  deleted_at: string | null;
  description: string | null;
  title: string;
  updated_at: string | null;
  updated_by: string;
};
