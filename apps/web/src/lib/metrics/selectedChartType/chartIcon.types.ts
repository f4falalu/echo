import {
  ChartEncodes,
  ChartType,
  ColumnMetaData,
  ChartConfigProps
} from '@buster/server-shared/metrics';

export interface SelectChartTypeProps {
  selectedChartType: ChartType;
  lineGroupType: ChartConfigProps['lineGroupType'];
  barGroupType: ChartConfigProps['barGroupType'];
  barLayout: ChartConfigProps['barLayout'];
  colors: string[];
  columnMetadata: ColumnMetaData[];
  columnSettings: ChartConfigProps['columnSettings'];
  selectedAxis: ChartEncodes;
}
