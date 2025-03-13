import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric';
import type { VerificationStatus } from '@/api/asset_interfaces/share';
import type { ShareRequest } from '@/api/asset_interfaces/shared_interfaces';

export interface GetMetricParams {
  id: string;
  password?: string;
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
  /** Dashboard ID to save the metric to */
  save_to_dashboard?: string[];
  /** Dashboard ID to remove the metric from */
  remove_from_dashboard?: string[];
  /** Array of collection IDs to add the metric to */
  add_to_collections?: string[];
  /** Array of collection IDs to remove the metric from */
  remove_from_collections?: string[];
  /** SQL query associated with the metric */
  sql?: string;
  chart_config?: BusterChartConfigProps;
  /** Flag to save the current draft state */
  save_draft?: boolean;
  /** Feedback status for the metric */
  feedback?: 'negative';
  /** Admin only: verification status update */
  status?: VerificationStatus;
  /** file in yaml format to update */
  file?: string;
} & ShareRequest;
