import type { BusterSocketRequestBase } from '../base_interfaces';
import type {
  DashboardsListRequest,
  DashboardSubscribeRequest,
  DashboardUnsubscribeRequest,
  DashboardCreateRequest,
  DashboardUpdateRequest,
  DashboardDeleteRequest
} from '@/api/request_interfaces/dashboards/interfaces';

/**
 * Payload type for requesting a list of dashboards
 *
 * @interface DashboardsListEmitPayload
 * @extends BusterSocketRequestBase<'/dashboards/list', DashboardsListRequest>
 */
export type DashboardsListEmitPayload = BusterSocketRequestBase<
  '/dashboards/list',
  DashboardsListRequest
>;

/**
 * Payload type for subscribing to a dashboard
 *
 * @interface DashboardSubscribeToDashboard
 * @extends BusterSocketRequestBase<'/dashboards/get', DashboardSubscribeRequest>
 */
export type DashboardSubscribeToDashboard = BusterSocketRequestBase<
  '/dashboards/get',
  DashboardSubscribeRequest
>;

/**
 * Payload type for unsubscribing from a specific dashboard
 *
 * @interface DashboardUnsubscribeFromDashboard
 * @extends BusterSocketRequestBase<'/dashboards/unsubscribe', DashboardUnsubscribeRequest>
 */
export type DashboardUnsubscribeFromDashboard = BusterSocketRequestBase<
  '/dashboards/unsubscribe',
  DashboardUnsubscribeRequest
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
 * @extends BusterSocketRequestBase<'/dashboards/post', DashboardCreateRequest>
 */
export type DashboardCreate = BusterSocketRequestBase<'/dashboards/post', DashboardCreateRequest>;

/**
 * Payload type for updating a dashboard
 *
 * @interface DashboardUpdate
 * @extends BusterSocketRequestBase<'/dashboards/update', DashboardUpdateRequest>
 */
export type DashboardUpdate = BusterSocketRequestBase<'/dashboards/update', DashboardUpdateRequest>;

/**
 * Payload type for deleting dashboards
 *
 * @interface DashboardDelete
 * @extends BusterSocketRequestBase<'/dashboards/delete', DashboardDeleteRequest>
 */
export type DashboardDelete = BusterSocketRequestBase<'/dashboards/delete', DashboardDeleteRequest>;

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
