import { DataMetadata, IDataResult } from './interfaces';

export type BusterMetricData = {
  data: IDataResult | null;
  dataFromRerun?: IDataResult; //this is actually only used in the UI. maybe move this to ?
  data_metadata: DataMetadata;
  metricId: string;
};
