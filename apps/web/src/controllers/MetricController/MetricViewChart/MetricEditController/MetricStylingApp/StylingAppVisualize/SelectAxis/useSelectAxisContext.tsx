import type React from 'react';
import type { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { ColumnMetaData, BusterMetricChartConfig } from '@/api/asset_interfaces';
import type {
  CategoryAxisStyleConfig,
  ChartEncodes,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from '@/api/asset_interfaces/metric/charts';

export interface ISelectAxisContext
  extends Required<YAxisConfig>,
    Required<Y2AxisConfig>,
    Required<Omit<XAxisConfig, 'xAxisTimeInterval'>>,
    Required<CategoryAxisStyleConfig> {
  selectedAxis: ChartEncodes | null;
  columnLabelFormats: BusterMetricChartConfig['columnLabelFormats'];
  columnMetadata: ColumnMetaData[];
  columnSettings: BusterMetricChartConfig['columnSettings'];
  selectedChartType: BusterMetricChartConfig['selectedChartType'];
  lineGroupType: BusterMetricChartConfig['lineGroupType'];
  barGroupType: BusterMetricChartConfig['barGroupType'];
  showLegend: BusterMetricChartConfig['showLegend'];
  showLegendHeadline: BusterMetricChartConfig['showLegendHeadline'];
  gridLines: BusterMetricChartConfig['gridLines'];
  goalLines: BusterMetricChartConfig['goalLines'];
  trendlines: BusterMetricChartConfig['trendlines'];
  barShowTotalAtTop: BusterMetricChartConfig['barShowTotalAtTop'];
  disableTooltip: BusterMetricChartConfig['disableTooltip'];
  rowCount: number;
}

const SelectAxisContext = createContext<ISelectAxisContext>({} as ISelectAxisContext);

export const SelectAxisProvider: React.FC<PropsWithChildren<ISelectAxisContext>> = ({
  children,
  ...props
}) => {
  return <SelectAxisContext.Provider value={props}>{children}</SelectAxisContext.Provider>;
};

export const useSelectAxisContextSelector = <T,>(selector: (state: ISelectAxisContext) => T) =>
  useContextSelector(SelectAxisContext, selector);
