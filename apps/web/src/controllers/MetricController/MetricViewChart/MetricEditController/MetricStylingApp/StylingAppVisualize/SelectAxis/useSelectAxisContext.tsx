import type React from 'react';
import type { PropsWithChildren } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import type { ColumnMetaData, ChartConfigProps } from '@buster/server-shared/metrics';
import type {
  CategoryAxisStyleConfig,
  ChartEncodes,
  XAxisConfig,
  Y2AxisConfig,
  YAxisConfig
} from '@buster/server-shared/metrics';

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
  showLegend: ChartConfigProps['showLegend'];
  showLegendHeadline: ChartConfigProps['showLegendHeadline'];
  gridLines: ChartConfigProps['gridLines'];
  goalLines: ChartConfigProps['goalLines'];
  trendlines: ChartConfigProps['trendlines'];
  barShowTotalAtTop: ChartConfigProps['barShowTotalAtTop'];
  disableTooltip: ChartConfigProps['disableTooltip'];
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
