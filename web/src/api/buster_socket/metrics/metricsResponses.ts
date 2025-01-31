import { BusterMetric, BusterMetricListItem } from '@/api/asset_interfaces';
import { MetricEvent_fetchingData } from './eventsInterfaces';

export enum MetricResponses {
  '/metrics/list:getMetricList' = '/metrics/list:getMetricList',
  '/metrics/list:updateMetricList' = '/metrics/list:updateMetricList',
  '/metrics/get:updateMetricState' = '/metrics/get:updateMetricState',
  '/metrics/unsubscribe:unsubscribed' = '/metrics/unsubscribe:unsubscribed',
  '/metrics/get:fetchingData' = '/metrics/get:fetchingData',
  '/metrics/delete:deleteMetricState' = '/metrics/delete:deleteMetricState',
  '/metrics/update:updateMetricState' = '/metrics/update:updateMetricState'
}

export type MetricList_getMetricList = {
  route: '/metrics/list:getMetricList';
  callback: (d: BusterMetricListItem[]) => void;
  onError?: (d: unknown) => void;
};

export type MetricGet_updateMetricState = {
  route: '/metrics/get:updateMetricState';
  callback: (d: BusterMetric) => void;
  onError?: (d: unknown) => void;
};

export type Metric_Unsubscribe = {
  route: '/metrics/unsubscribe:unsubscribed';
  callback: (d: { id: string }[]) => void;
  onError?: (d: unknown) => void;
};

export type MetricGet_fetchingData = {
  route: '/metrics/get:fetchingData';
  callback: (d: MetricEvent_fetchingData) => void;
  onError?: (d: unknown) => void;
};

export type MetricList_updateMetricList = {
  route: '/metrics/list:updateMetricList';
  callback: (d: BusterMetricListItem[]) => void;
  onError?: (d: unknown) => void;
};

/*********** OTHER */

export type MetricDelete_deleteMetricState = {
  route: '/metrics/delete:deleteMetricState';
  callback: (d: unknown) => void;
  onError?: (d: unknown) => void;
};

export type MetricUpdate_updateMetricState = {
  route: '/metrics/update:updateMetricState';
  callback: (d: BusterMetric) => void;
  onError?: (d: unknown) => void;
};

export type MetricResponseTypes =
  | MetricList_getMetricList
  | Metric_Unsubscribe
  | MetricGet_updateMetricState
  | MetricList_updateMetricList
  | MetricDelete_deleteMetricState
  | MetricUpdate_updateMetricState
  | MetricGet_fetchingData
  | MetricGet_fetchingData
  | MetricUpdate_updateMetricState
  | MetricDelete_deleteMetricState;
