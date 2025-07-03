import type { DataMetadata, DataResult } from '@buster/server-shared/metrics';

export type BusterMetricData = {
  data: DataResult | null;
  data_metadata: DataMetadata;
  metricId: string;
};

export type BusterMetricDataExtended = {
  data: DataResult | null;
  dataFromRerun?: DataResult; //this is actually only used in the UI. maybe move this to ?
  data_metadata: DataMetadata;
  runRunDataMetadata?: DataMetadata;
  metricId: string;
} & BusterMetricData;
