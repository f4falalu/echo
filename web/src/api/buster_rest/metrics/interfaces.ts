import { BusterMetric, VerificationStatus } from '@/api/asset_interfaces';

export interface GetMetricParams {
  id: string;
  password?: string;
}

export interface ListMetricsParams {
  /** The token representing the current page number for pagination */
  page_token: number;
  /** The number of items to return per page */
  page_size: number;
  /** Flag to enable admin view with additional permissions and data */
  admin_view?: boolean;
  /** Filtering options for metrics based on verification status */
  status?: VerificationStatus[] | null;
}
