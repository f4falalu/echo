import type { ColumnMetaData } from '@/api/asset_interfaces/metric';
import type { BusterChartConfigProps } from './chartConfigProps';

export type BusterChartProps = {
  data: Record<string, string | number | null | Date>[] | null;
  groupByMethod?: 'sum' | 'average' | 'count';
  loading?: boolean;
  className?: string;
  animate?: boolean;
  animateLegend?: boolean;
  id?: string;
  error?: string;
  columnMetadata?: ColumnMetaData[];
  readOnly?: boolean;
  onInitialAnimationEnd?: () => void;
  onChartMounted?: (chart?: any) => void;
} & BusterChartConfigProps;
