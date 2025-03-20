import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric';
import type { VerificationStatus } from '@/api/asset_interfaces/share';

export interface GetMetricParams {
  id: string;
  password?: string;
  version_number?: number; //api will default to latest if not provided
}

export interface ListMetricsParams {
  /** The token representing the current page number for pagination */
  page_token: number;
  /** The number of items to return per page */
  page_size: number;
  /** Filtering options for metrics based on verification status */
  status?: VerificationStatus[] | null;
}

/**
 * Request payload for updating metric properties
 */
export type UpdateMetricParams = {
  /** The unique identifier of the metric to update */
  id: string;
  /** New title for the metric */
  title?: string;
  /** SQL query associated with the metric */
  sql?: string;
  chart_config?: BusterChartConfigProps;
  /** Flag to save the current draft state */
  save_draft?: boolean;
  /** Admin only: verification status update */
  status?: VerificationStatus;
  /** file in yaml format to update */
  file?: string;
};
