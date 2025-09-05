import type { ChartConfigProps } from '@buster/server-shared/metrics';

export type BusterTableChartConfig = {
  type: 'table';
  tableColumnOrder?: ChartConfigProps['tableColumnOrder'];
  tableColumnWidths?: ChartConfigProps['tableColumnWidths'];
  tableHeaderBackgroundColor?: string | null;
  tableHeaderFontColor?: string | null;
  tableColumnFontColor?: string | null;
  columnLabelFormats?: NonNullable<ChartConfigProps['columnLabelFormats']>;
};
