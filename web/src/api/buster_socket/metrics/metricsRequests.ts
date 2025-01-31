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

export type MetricCreateNewMetric = BusterSocketRequestBase<
  '/metrics/post',
  {
    dataset_id: string | null;
    metric_id: string | null;
    suggestion_id?: string | null;
    prompt?: string;
    message_id?: string; //only send if we want to REPLACE current message
    draft_session_id?: string;
  }
>;

export enum ShareRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export type MetricUpdateMetric = BusterSocketRequestBase<
  '/metrics/update',
  {
    id: string; //metric id
    save_to_dashboard?: string;
    remove_from_dashboard?: string; // dashboard_id optional
    add_to_collections?: string[]; // collection_id
    remove_from_collections?: string[]; // collection_id
    save_draft?: boolean;
  } & ShareRequest
>;

export type MetricUpdateMessage = BusterSocketRequestBase<
  '/metrics/messages/update',
  {
    id: string; //messageid id
    chart_config?: BusterChartConfigProps;
    title?: string;
    sql?: string;
    feedback?: 'negative';
    status?: VerificationStatus;
  }
>;

export type MetricDelete = BusterSocketRequestBase<'/metrics/delete', { ids: string[] }>;

export type MetricGetDataByMessageId = BusterSocketRequestBase<'/metrics/data', { id: string }>;

export type MetricSearch = BusterSocketRequestBase<
  '/metrics/search',
  {
    prompt: string;
  }
>;

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
  | MetricCreateNewMetric
  | MetricSubscribeToMetric
  | MetricDelete
  | MetricUpdateMessage
  | MetricGetDataByMessageId
  | MetricSearch;
