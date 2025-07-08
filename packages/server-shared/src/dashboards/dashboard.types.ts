import type { VerificationStatus } from '../share';

export interface Dashboard {
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
  version_number: number;
  file: string; //yaml file
  file_name: string;
}

export interface DashboardConfig {
  rows?: {
    columnSizes?: number[]; //columns sizes 1 - 12. MUST add up to 12
    rowHeight?: number; //pixel based!
    id: string;
    items: { id: string }[];
  }[];
}
