import type {
  BusterMetric,
  DataMetadata,
  IBusterMetricChartConfig,
  IDataResult
} from '@/api/asset_interfaces';

export interface IBusterMetric extends Required<BusterMetric> {
  chart_config: IBusterMetricChartConfig;
  fetched: boolean;
  fetching: boolean;
  fetchedAt: number;
}

export interface BusterMetricData {
  data?: IDataResult;
  dataFromRerun?: IDataResult;
  fetched: boolean;
  fetching: boolean;
  fetchedAt: number;
  data_metadata: DataMetadata;
  code: string | null;
  error: string | null;
}
