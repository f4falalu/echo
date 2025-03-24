import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric';
import type { VerificationStatus } from '@/api/asset_interfaces/share';

export interface GetMetricParams {
  id: string;
  password?: string;
  version_number?: number; //api will default to latest if not provided
}

/**
 * Request payload for updating metric properties
 */
export type UpdateMetricParams = {
  /** The unique identifier of the metric to update */
  id: string;
  /** New title for the metric */
  name?: string;
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
