import type {
  BusterChartConfigProps,
  ColumnSettings,
  IColumnLabelFormat
} from '@/components/ui/charts/interfaces';

export type IBusterMetricChartConfig = Required<
  Omit<BusterChartConfigProps, 'columnLabelFormats'>
> & {
  columnLabelFormats: Record<string, Required<IColumnLabelFormat>>;
  columnSettings: Required<Record<string, Required<ColumnSettings>>>;
};
