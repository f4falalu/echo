import type { DataMetadata, IDataResult } from '@/api/asset_interfaces';

export type BusterMetricData = {
  data: IDataResult | null;
  dataFromRerun?: IDataResult;
  data_metadata: DataMetadata;
  code: string | null;
  metricId: string;
};
