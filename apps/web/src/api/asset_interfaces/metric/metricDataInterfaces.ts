import type { DataMetadata, DataResult, MetricDataResponse } from '@buster/server-shared/metrics';

export type BusterMetricData = MetricDataResponse;

export type BusterMetricDataExtended = {
  data: DataResult | null;
  dataFromRerun?: DataResult; //this is actually only used in the UI. maybe move this to ?
  data_metadata: DataMetadata;
  runRunDataMetadata?: DataMetadata;
  metricId: string;
} & BusterMetricData;
