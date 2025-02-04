import type { BusterChartConfigProps } from '@/components/charts/interfaces';
import type { DataMetadata } from '../../asset_interfaces';
import type { EventBase } from '../base_interfaces';

export type MetricEvent_fetchingData = {
  metric_id: string;
  data: null | Record<string, string | number | number>[];
  data_metadata: DataMetadata;
  chart_config: BusterChartConfigProps;
  code: string | null;
} & EventBase;
