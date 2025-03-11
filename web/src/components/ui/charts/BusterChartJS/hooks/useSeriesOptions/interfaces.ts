import type {
  BusterChartProps,
  ChartEncodes,
  IColumnLabelFormat,
  ScatterAxis
} from '@/api/asset_interfaces/metric/charts';
import type { DatasetOption } from '../../../chartHooks';

export interface SeriesBuilderProps {
  selectedDataset: DatasetOption;
  allYAxisKeysIndexes: {
    name: string;
    index: number;
  }[];
  allY2AxisKeysIndexes: {
    name: string;
    index: number;
  }[];
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  colors: string[];
  columnLabelFormats: Record<string, IColumnLabelFormat>;
  xAxisKeys: ChartEncodes['x'];
  categoryKeys: ScatterAxis['category'];
  sizeKeyIndex: {
    name: string;
    index: number;
    minValue: number;
    maxValue: number;
  } | null;
  scatterDotSize: BusterChartProps['scatterDotSize'];
  lineGroupType: BusterChartProps['lineGroupType'];
  selectedChartType: BusterChartProps['selectedChartType'];
  barShowTotalAtTop: BusterChartProps['barShowTotalAtTop'];
}
