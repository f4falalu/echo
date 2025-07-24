import type { ChartConfigProps, ColumnMetaData } from '@buster/server-shared/metrics';
import type { Chart, ChartType, DefaultDataPoint } from 'chart.js';

export type BusterChartPropsBase = {
  onMounted: () => void;
  onInitialAnimationEnd: () => void;
  className?: string;
  animate?: boolean;
  data: Record<string, string | null | Date | number>[];
  isDarkMode?: boolean;
  readOnly?: boolean;
};

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
  onChartMounted?: (chart?: ChartJSOrUndefined) => void;
} & ChartConfigProps;

type ChartJSOrUndefined<
  TType extends ChartType = ChartType,
  TData = DefaultDataPoint<TType>,
  TLabel = unknown
> = Chart<TType, TData, TLabel> | undefined;
