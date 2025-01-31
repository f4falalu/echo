import type {
  BusterChartConfigProps,
  ColumnSettings,
  IColumnLabelFormat
} from '@/components/charts/interfaces';

export type IBusterMetricChartConfig = Required<
  Omit<BusterChartConfigProps, 'columnLabelFormats'>
> & {
  columnLabelFormats: Record<string, Required<IColumnLabelFormat>>;
  columnSettings: Required<Record<string, Required<ColumnSettings>>>;
};
