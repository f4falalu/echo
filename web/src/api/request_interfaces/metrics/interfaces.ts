import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';
import type { VerificationStatus } from '@/api/asset_interfaces/share';
import type { ShareRequest } from '@/api/asset_interfaces/shared_interfaces';

/**
 * Request payload for listing metrics with pagination and filtering options
 */
export type MetricListRequest = {
  /** The token representing the current page number for pagination */
  page_token: number;
  /** The number of items to return per page */
  page_size: number;
  /** Flag to enable admin view with additional permissions and data */
  admin_view?: boolean;
  /** Filtering options for metrics based on verification status */
  status?: VerificationStatus[] | null;
};

/**
 * Request payload for unsubscribing from metric updates
 */
export type MetricUnsubscribeRequest = {
  /** The ID of the metric to unsubscribe from, null to unsubscribe from all */
  id: null | string;
};

/**
 * Request payload for subscribing to a specific metric
 */
export type MetricSubscribeRequest = {
  /** The unique identifier of the metric to subscribe to */
  id: string;
  /** Optional password for accessing protected metrics */
  password?: string;
};

/**
 * Request payload for updating metric properties
 */
export type MetricUpdateRequest = {
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
  /** Chart configuration properties */
  chart_config?: BusterChartConfigProps;
  /** Flag to save the current draft state */
  save_draft?: boolean;
  /** Feedback status for the metric */
  feedback?: 'negative';
  /** Admin only: verification status update */
  status?: VerificationStatus;
} & ShareRequest;

/**
 * Request payload for deleting metrics
 */
export type MetricDeleteRequest = {
  /** Array of metric IDs to delete */
  ids: string[];
};

/**
 * Request payload for retrieving metric data by message ID
 */
export type MetricGetDataByMessageIdRequest = {
  /** Message ID to retrieve metric data for */
  id: string;
};

/**
 * Request payload for searching metrics
 */
export type MetricSearchRequest = {
  /** Search prompt/query string */
  prompt: string;
};

/**
 * Request payload for duplicating a metric
 */
export type MetricDuplicateRequest = {
  /** ID of the metric to duplicate */
  id: string;
  /** Message ID associated with the duplication */
  message_id: string;
  /** Whether to maintain the same sharing settings */
  share_with_same_people: boolean;
};
