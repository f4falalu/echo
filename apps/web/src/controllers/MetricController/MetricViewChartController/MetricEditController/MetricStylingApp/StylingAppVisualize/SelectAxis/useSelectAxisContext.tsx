import type {
  CategoryAxisStyleConfig,
  ChartConfigProps,
  ChartEncodes,
  ColumnLabelFormat,
  ColumnMetaData,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig,
} from '@buster/server-shared/metrics';
import type React from 'react';
import { type PropsWithChildren, useCallback } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';

export interface ISelectAxisContext
  extends Required<YAxisConfig>,
    Required<Y2AxisConfig>,
    Required<Omit<XAxisConfig, 'xAxisTimeInterval'>>,
    Required<CategoryAxisStyleConfig> {
  selectedAxis: ChartEncodes | null;
  columnLabelFormats: ChartConfigProps['columnLabelFormats'];
  columnMetadata: ColumnMetaData[];
  columnSettings: ChartConfigProps['columnSettings'];
  selectedChartType: ChartConfigProps['selectedChartType'];
  lineGroupType: ChartConfigProps['lineGroupType'];
  barGroupType: ChartConfigProps['barGroupType'];
  barLayout: ChartConfigProps['barLayout'];
  showLegend: ChartConfigProps['showLegend'];
  showLegendHeadline: ChartConfigProps['showLegendHeadline'];
  gridLines: ChartConfigProps['gridLines'];
  goalLines: ChartConfigProps['goalLines'];
  trendlines: ChartConfigProps['trendlines'];
  barShowTotalAtTop: ChartConfigProps['barShowTotalAtTop'];
  disableTooltip: ChartConfigProps['disableTooltip'];
  rowCount: number;
  metricId: string;
}

const SelectAxisContext = createContext<ISelectAxisContext>({} as ISelectAxisContext);

export const SelectAxisProvider: React.FC<PropsWithChildren<ISelectAxisContext>> = ({
  children,
  ...props
}) => {
  return <SelectAxisContext.Provider value={props}>{children}</SelectAxisContext.Provider>;
};

const useSelectAxisContextSelector = <T,>(selector: (state: ISelectAxisContext) => T) => {
  if (!SelectAxisContext) {
    throw new Error('SelectAxisContext not found');
  }
  return useContextSelector(SelectAxisContext, selector);
};

const stableMetricIdSelector = (x: ISelectAxisContext) => x.metricId;
export const useAxisContextMetricId = () => {
  return useSelectAxisContextSelector(stableMetricIdSelector);
};

const stableRowCountSelector = (x: ISelectAxisContext) => x.rowCount;
export const useAxisContextRowCount = () => {
  return useSelectAxisContextSelector(stableRowCountSelector);
};

const stableColumnLabelFormatsSelector = (x: ISelectAxisContext) => x.columnLabelFormats;
export const useAxisContextColumnLabelFormats = (): ChartConfigProps['columnLabelFormats'] => {
  return useSelectAxisContextSelector(stableColumnLabelFormatsSelector);
};

export const useAxisContextColumnLabelFormat = (id: string): ColumnLabelFormat => {
  return useSelectAxisContextSelector(useCallback((x) => x.columnLabelFormats[id], [id]));
};

const stableColumnSettingsSelector = (x: ISelectAxisContext) => x.columnSettings;
export const useAxisContextColumnSettings = () => {
  return useSelectAxisContextSelector(stableColumnSettingsSelector);
};

export const useAxisContextColumnSetting = (
  id: string
): ChartConfigProps['columnSettings'][string] => {
  return useSelectAxisContextSelector(useCallback((x) => x.columnSettings[id], [id]));
};

const stableSelectedAxisSelector = (x: ISelectAxisContext) => x.selectedAxis;
export const useAxisContextSelectedAxis = () => {
  return useSelectAxisContextSelector(stableSelectedAxisSelector);
};

const stableSelectedChartTypeSelector = (x: ISelectAxisContext) => x.selectedChartType;
export const useAxisContextSelectedChartType = () => {
  return useSelectAxisContextSelector(stableSelectedChartTypeSelector);
};

const stableLineGroupTypeSelector = (x: ISelectAxisContext) => x.lineGroupType;
export const useAxisContextLineGroupType = () => {
  return useSelectAxisContextSelector(stableLineGroupTypeSelector);
};

const stableBarGroupTypeSelector = (x: ISelectAxisContext) => x.barGroupType;
export const useAxisContextBarGroupType = () => {
  return useSelectAxisContextSelector(stableBarGroupTypeSelector);
};

const stableShowLegendSelector = (x: ISelectAxisContext) => x.showLegend;
export const useAxisContextShowLegend = () => {
  return useSelectAxisContextSelector(stableShowLegendSelector);
};

const stableShowLegendHeadlineSelector = (x: ISelectAxisContext) => x.showLegendHeadline;
export const useAxisContextShowLegendHeadline = () => {
  return useSelectAxisContextSelector(stableShowLegendHeadlineSelector);
};

const stableGridLinesSelector = (x: ISelectAxisContext) => x.gridLines;
export const useAxisContextGridLines = () => {
  return useSelectAxisContextSelector(stableGridLinesSelector);
};

const stableGoalLinesSelector = (x: ISelectAxisContext) => x.goalLines;
export const useAxisContextGoalLines = () => {
  return useSelectAxisContextSelector(stableGoalLinesSelector);
};

const stableCategoryAxisTitleSelector = (x: ISelectAxisContext) => x.categoryAxisTitle;
export const useAxisContextCategoryAxisTitle = () => {
  return useSelectAxisContextSelector(stableCategoryAxisTitleSelector);
};

const stableBarShowTotalAtTopSelector = (x: ISelectAxisContext) => x.barShowTotalAtTop;
export const useAxisContextBarShowTotalAtTop = () => {
  return useSelectAxisContextSelector(stableBarShowTotalAtTopSelector);
};

const stableDisableTooltipSelector = (x: ISelectAxisContext) => x.disableTooltip;
export const useAxisContextDisableTooltip = () => {
  return useSelectAxisContextSelector(stableDisableTooltipSelector);
};

const stableXAxisAxisTitleSelector = (x: ISelectAxisContext) => x.xAxisAxisTitle;
export const useAxisContextXAxisAxisTitle = () => {
  return useSelectAxisContextSelector(stableXAxisAxisTitleSelector);
};

const stableXAxisShowAxisLabelSelector = (x: ISelectAxisContext) => x.xAxisShowAxisLabel;
export const useAxisContextXAxisShowAxisLabel = () => {
  return useSelectAxisContextSelector(stableXAxisShowAxisLabelSelector);
};

const stableXAxisLabelRotationSelector = (x: ISelectAxisContext) => x.xAxisLabelRotation;
export const useAxisContextXAxisLabelRotation = () => {
  return useSelectAxisContextSelector(stableXAxisLabelRotationSelector);
};

const stableXAxisShowAxisTitleSelector = (x: ISelectAxisContext) => x.xAxisShowAxisTitle;
export const useAxisContextXAxisShowAxisTitle = () => {
  return useSelectAxisContextSelector(stableXAxisShowAxisTitleSelector);
};

const stableY2AxisAxisTitleSelector = (x: ISelectAxisContext) => x.y2AxisAxisTitle;
export const useAxisContextY2AxisAxisTitle = () => {
  return useSelectAxisContextSelector(stableY2AxisAxisTitleSelector);
};

const stableY2AxisShowAxisLabelSelector = (x: ISelectAxisContext) => x.y2AxisShowAxisLabel;
export const useAxisContextY2AxisShowAxisLabel = () => {
  return useSelectAxisContextSelector(stableY2AxisShowAxisLabelSelector);
};

const stableY2AxisScaleTypeSelector = (x: ISelectAxisContext) => x.y2AxisScaleType;

export const useAxisContextY2AxisScaleType = () => {
  return useSelectAxisContextSelector(stableY2AxisScaleTypeSelector);
};

const stableY2AxisShowAxisTitleSelector = (x: ISelectAxisContext) => x.y2AxisShowAxisTitle;
export const useAxisContextY2AxisShowAxisTitle = () => {
  return useSelectAxisContextSelector(stableY2AxisShowAxisTitleSelector);
};

const stableYAxisAxisTitleSelector = (x: ISelectAxisContext) => x.yAxisAxisTitle;
export const useAxisContextYAxisAxisTitle = () => {
  return useSelectAxisContextSelector(stableYAxisAxisTitleSelector);
};

const stableYAxisShowAxisLabelSelector = (x: ISelectAxisContext) => x.yAxisShowAxisLabel;
export const useAxisContextYAxisShowAxisLabel = () => {
  return useSelectAxisContextSelector(stableYAxisShowAxisLabelSelector);
};

const stableYAxisScaleTypeSelector = (x: ISelectAxisContext) => x.yAxisScaleType;
export const useAxisContextYAxisScaleType = () => {
  return useSelectAxisContextSelector(stableYAxisScaleTypeSelector);
};

const stableYAxisShowAxisTitleSelector = (x: ISelectAxisContext) => x.yAxisShowAxisTitle;
export const useAxisContextYAxisShowAxisTitle = () => {
  return useSelectAxisContextSelector(stableYAxisShowAxisTitleSelector);
};
