import type { IColumnLabelFormat } from '@/components/ui/charts/interfaces/columnLabelInterfaces';
import type { BusterChartConfigProps } from '@/components/ui/charts/interfaces/chartConfigProps';
import type { ColumnSettings } from '@/components/ui/charts/interfaces/columnInterfaces';

export type IBusterMetricChartConfig = Required<
  Omit<BusterChartConfigProps, 'columnLabelFormats'>
> & {
  columnLabelFormats: Record<string, Required<IColumnLabelFormat>>;
  columnSettings: Required<Record<string, Required<ColumnSettings>>>;
};
