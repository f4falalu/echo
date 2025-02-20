import type { BusterChartConfigProps } from '@/components/ui/charts/interfaces';
import type { DataMetadata, IDataResult } from '../../asset_interfaces';
import type { EventBase } from '../base_interfaces';

export type MetricEvent_fetchingData = {
  metric_id: string;
  data: IDataResult;
  data_metadata: DataMetadata;
  chart_config: BusterChartConfigProps;
  code: string | null;
} & EventBase;
