import { DataMetadata, IDataResult } from './interfaces';

export type BusterMetricData = {
  data: IDataResult | null;
  dataFromRerun?: IDataResult;
  data_metadata: DataMetadata;
  code: string | null;
  metricId: string;
};
