import { BusterSocketRequestBase } from '../base_interfaces';
import {
  MetricListRequest,
  MetricUnsubscribeRequest,
  MetricSubscribeRequest,
  MetricUpdateRequest,
  MetricDeleteRequest,
  MetricSearchRequest,
  MetricDuplicateRequest
} from '@/api/request_interfaces/metrics';

/**
 * Request payload for listing metrics with pagination and filtering options
 */
export type MetricListEmitPayload = BusterSocketRequestBase<'/metrics/list', MetricListRequest>;

/**
 * Request payload for unsubscribing from metric updates
 */
export type MetricUnsubscribeEmitPayload = BusterSocketRequestBase<
  '/metrics/unsubscribe',
  MetricUnsubscribeRequest
>;

/**
 * Request payload for subscribing to a specific metric
 */
export type MetricSubscribeToMetric = BusterSocketRequestBase<
  '/metrics/get',
  MetricSubscribeRequest
>;

/**
 * Request payload for updating metric properties
 */
export type MetricUpdateMetric = BusterSocketRequestBase<'/metrics/update', MetricUpdateRequest>;

/**
 * Request payload for deleting metrics
 */
export type MetricDelete = BusterSocketRequestBase<'/metrics/delete', MetricDeleteRequest>;

/**
 * Request payload for searching metrics
 */
export type MetricSearch = BusterSocketRequestBase<'/metrics/search', MetricSearchRequest>;

/**
 * Request payload for duplicating a metric
 */
export type MetricDuplicate = BusterSocketRequestBase<'/metrics/duplicate', MetricDuplicateRequest>;

/**
 * Union type of all possible metric emit payloads
 */
export type MetricEmits =
  | MetricDuplicate
  | MetricListEmitPayload
  | MetricUnsubscribeEmitPayload
  | MetricUpdateMetric
  | MetricSubscribeToMetric
  | MetricDelete
  | MetricSearch;
