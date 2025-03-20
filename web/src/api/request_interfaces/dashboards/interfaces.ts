import type { DashboardConfig } from '@/api/asset_interfaces/dashboard';
import { VerificationStatus } from '@/api/asset_interfaces/share';

/**
 * Interface for dashboard list request parameters
 */
export interface DashboardsListRequest {
  /** The page number to fetch */
  page_token: number;
  /** Number of items per page */
  page_size: number;
  /** Filter for dashboards shared with the current user */
  shared_with_me?: boolean;
  /** Filter for dashboards owned by the current user */
  only_my_dashboards?: boolean;
}

/**
 * Interface for subscribing to a dashboard
 */
export interface DashboardSubscribeRequest {
  /** The unique identifier of the dashboard */
  id: string;
  /** Optional password for accessing protected dashboards */
  password?: string;
}

/**
 * Interface for unsubscribing from a specific dashboard
 */
export interface DashboardUnsubscribeRequest {
  /** The unique identifier of the dashboard to unsubscribe from */
  id: string;
}

/**
 * Interface for creating a new dashboard
 */
export interface DashboardCreateRequest {
  /** The name of the dashboard */
  name?: string;
  /** Optional description of the dashboard */
  description?: string | null;
}

/**
 * Interface for updating a dashboard
 */
export type DashboardUpdateRequest = {
  /** The unique identifier of the dashboard */
  id: string;
  /** New name for the dashboard */
  name?: string;
  /** New description for the dashboard */
  description?: string | null;
  /** Updated dashboard configuration */
  config?: DashboardConfig;
  /** The file content of the dashboard */
  file?: string;
};

/**
 * Interface for deleting dashboards
 */
export interface DashboardDeleteRequest {
  /** Array of dashboard IDs to delete */
  ids: string[];
}
