import type { ChartEncodes } from '@buster/server-shared/metrics';
import type { BusterChartProps } from '../../../BusterChart.types';
import type { DatasetOptionsWithTicks } from '../../../chartHooks';

export interface SeriesBuilderProps {
  datasetOptions: DatasetOptionsWithTicks;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  colors: string[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  xAxisKeys: ChartEncodes['x'];
  sizeOptions: {
    key: string;
    minValue: number;
    maxValue: number;
  } | null;
  scatterDotSize: BusterChartProps['scatterDotSize'];
  lineGroupType: BusterChartProps['lineGroupType'];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
  barGroupType: BusterChartProps['barGroupType'];
  yAxisKeys: string[];
  y2AxisKeys: string[];
  trendlines: BusterChartProps['trendlines'];
}
