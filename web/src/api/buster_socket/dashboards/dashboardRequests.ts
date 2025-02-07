import type { ShareRole, DashboardConfig, VerificationStatus } from '@/api/asset_interfaces';
import type { BusterSocketRequestBase } from '../base_interfaces';
import { ShareRequest } from '../shared_interfaces';

/**
 * Payload type for requesting a list of dashboards
 *
 * @interface DashboardsListEmitPayload
 * @extends BusterSocketRequestBase<'/dashboards/list', Object>
 */
export type DashboardsListEmitPayload = BusterSocketRequestBase<
  '/dashboards/list',
  {
    /** The page number to fetch */
    page: number;
    /** Number of items per page */
    page_size: number;
    /** Filter for dashboards shared with the current user */
    shared_with_me?: boolean;
    /** Filter for dashboards owned by the current user */
    only_my_dashboards?: boolean;
  }
>;

/**
 * Payload type for subscribing to a dashboard
 *
 * @interface DashboardSubscribeToDashboard
 * @extends BusterSocketRequestBase<'/dashboards/get', Object>
 */
export type DashboardSubscribeToDashboard = BusterSocketRequestBase<
  '/dashboards/get',
  {
    /** The unique identifier of the dashboard */
    id: string;
    /** Optional password for accessing protected dashboards */
    password?: string;
  }
>;

/**
 * Payload type for unsubscribing from a specific dashboard
 *
 * @interface DashboardUnsubscribeFromDashboard
 * @extends BusterSocketRequestBase<'/dashboards/unsubscribe', Object>
 */
export type DashboardUnsubscribeFromDashboard = BusterSocketRequestBase<
  '/dashboards/unsubscribe',
  {
    /** The unique identifier of the dashboard to unsubscribe from */
    id: string;
  }
>;

/**
 * Payload type for unsubscribing from all dashboards
 *
 * @interface DashboardUnsubscribeFromAll
 * @extends BusterSocketRequestBase<'/dashboards/unsubscribe', Object>
 */
export type DashboardUnsubscribeFromAll = BusterSocketRequestBase<'/dashboards/unsubscribe', {}>;

/**
 * Payload type for creating a new dashboard
 *
 * @interface DashboardCreate
 * @extends BusterSocketRequestBase<'/dashboards/post', Object>
 */
export type DashboardCreate = BusterSocketRequestBase<
  '/dashboards/post',
  {
    /** The name of the dashboard */
    name: string;
    /** Optional description of the dashboard */
    description?: string | null;
  }
>;

/**
 * Payload type for updating a dashboard
 *
 * @interface DashboardUpdate
 * @extends BusterSocketRequestBase<'/dashboards/update', Object>
 */
export type DashboardUpdate = BusterSocketRequestBase<
  '/dashboards/update',
  {
    /** The unique identifier of the dashboard */
    id: string;
    /** New title for the dashboard */
    title?: string;
    /** New description for the dashboard */
    description?: string | null;
    /** Updated dashboard configuration */
    config?: DashboardConfig;
    /** Updated verification status */
    status?: VerificationStatus;
    /** Collection IDs to add the dashboard to */
    add_to_collections?: string[];
    /** Collection IDs to remove the dashboard from */
    remove_from_collections?: string[];
    /** User IDs to remove access from */
    remove_users?: string[];
    /** Array of metric IDs associated with the dashboard */
    metrics?: string[];
  } & ShareRequest
>;

/**
 * Payload type for deleting dashboards
 *
 * @interface DashboardDelete
 * @extends BusterSocketRequestBase<'/dashboards/delete', Object>
 */
export type DashboardDelete = BusterSocketRequestBase<
  '/dashboards/delete',
  {
    /** Array of dashboard IDs to delete */
    ids: string[];
  }
>;

/**
 * Union type of all possible dashboard-related socket emit payloads
 */
export type DashboardEmits =
  | DashboardsListEmitPayload
  | DashboardSubscribeToDashboard
  | DashboardUnsubscribeFromDashboard
  | DashboardUnsubscribeFromAll
  | DashboardCreate
  | DashboardUpdate
  | DashboardDelete;
