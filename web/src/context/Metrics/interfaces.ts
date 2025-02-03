import type { BusterMetric, DataMetadata, IBusterMetricChartConfig } from '@/api/asset_interfaces';

export interface IBusterMetric extends Required<BusterMetric> {
  chart_config: IBusterMetricChartConfig;
  fetched: boolean;
  fetching: boolean;
  fetchedAt: number;
}

export interface BusterMetricData {
  data?: Record<string, null | string | number>[] | null;
  dataFromRerun?: Record<string, string | number | null>[] | null;
  fetched: boolean;
  fetching: boolean;
  fetchedAt: number;
  data_metadata: DataMetadata;
  code: string | null;
  error: string | null;
}
