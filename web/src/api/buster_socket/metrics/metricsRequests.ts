import { BusterChartConfigProps } from '@/components/charts';
import { BusterSocketRequestBase } from '../base_interfaces';
import { ShareRequest } from '../dashboards';
import { VerificationStatus } from '@/api/asset_interfaces';

export type MetricListEmitPayload = BusterSocketRequestBase<
  '/metrics/list',
  {
    page_token: number;
    page_size: number;
    admin_view: boolean;
    filters?: { status: VerificationStatus[] | null };
  }
>;

export type MetricUnsubscribeEmitPayload = BusterSocketRequestBase<
  '/metrics/unsubscribe',
  { id: null | string }
>;

export type MetricSubscribeToMetric = BusterSocketRequestBase<
  '/metrics/get',
  { id: string; password?: string }
>;

export type MetricUpdateMetric = BusterSocketRequestBase<
  '/metrics/update',
  {
    id: string; //metric id
    title?: string;
    save_to_dashboard?: string;
    remove_from_dashboard?: string; // dashboard_id optional
    add_to_collections?: string[]; // collection_id
    remove_from_collections?: string[]; // collection_id
    sql?: string;
    chart_config?: BusterChartConfigProps;
    save_draft?: boolean; //send if we want the metric (which is currently in draft) to be saved
    feedback?: 'negative'; //send if we want to update the feedback of the metric
    status?: VerificationStatus; //admin only: send if we want to update the status of the metric
  } & ShareRequest
>;

export type MetricDelete = BusterSocketRequestBase<'/metrics/delete', { ids: string[] }>;

export type MetricGetDataByMessageId = BusterSocketRequestBase<'/metrics/data', { id: string }>;

export type MetricSearch = BusterSocketRequestBase<'/metrics/search', { prompt: string }>;

export type MetricDuplicate = BusterSocketRequestBase<
  '/metrics/duplicate',
  {
    id: string;
    message_id: string;
    share_with_same_people: boolean;
  }
>;

export type MetricEmits =
  | MetricDuplicate
  | MetricListEmitPayload
  | MetricUnsubscribeEmitPayload
  | MetricUpdateMetric
  | MetricSubscribeToMetric
  | MetricDelete
  | MetricGetDataByMessageId
  | MetricSearch;
