import {
  ChartEncodes,
  ChartType,
  ColumnMetaData,
  BusterMetricChartConfig
} from '@/api/asset_interfaces/metric';

export interface SelectChartTypeProps {
  selectedChartType: ChartType;
  lineGroupType: BusterMetricChartConfig['lineGroupType'];
  barGroupType: BusterMetricChartConfig['barGroupType'];
  barLayout: BusterMetricChartConfig['barLayout'];
  colors: string[];
  columnMetadata: ColumnMetaData[];
  columnSettings: BusterMetricChartConfig['columnSettings'];
  selectedAxis: ChartEncodes;
}
