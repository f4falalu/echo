import type React from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import {
  type CategoryAxisStyleConfig,
  type ChartEncodes,
  type MetricChartProps,
  type Y2AxisConfig,
  type YAxisConfig
} from '@buster/server-shared/metrics';
import { cn } from '@/lib/classMerge';
import { StylingLabel } from '../Common';
import { SelectAxis } from './SelectAxis';
import type { ISelectAxisContext } from './SelectAxis/useSelectAxisContext';
import { SelectChartType } from './SelectChartType';
import { StylingMetric } from './StylingMetric';

export const StylingAppVisualize: React.FC<
  {
    barLayout: ChartConfigProps['barLayout'];
    selectedAxis: ChartEncodes;
    className?: string;
    colors: string[];
    disableTooltip: ChartConfigProps['disableTooltip'];
  } & Required<YAxisConfig> &
    Required<CategoryAxisStyleConfig> &
    Required<Y2AxisConfig> &
    Omit<ISelectAxisContext, 'selectedAxis'> &
    Required<MetricChartProps>
> = ({ className, colors, ...props }) => {
  const {
    selectedChartType,
    barGroupType,
    lineGroupType,
    barLayout,
    metricColumnId,
    metricHeader,
    metricSubHeader,
    rowCount,
    metricValueAggregate,
    columnLabelFormats,
    columnMetadata,
    columnSettings,
    selectedAxis
  } = props;

  const isMetricChart = selectedChartType === 'metric';

  return (
    <div className={'flex h-full w-full flex-col space-y-3'}>
      <div className={className}>
        <StylingLabel label="Chart type">
          <SelectChartType
            selectedChartType={selectedChartType}
            lineGroupType={lineGroupType}
            barLayout={barLayout}
            barGroupType={barGroupType}
            colors={colors}
            columnMetadata={columnMetadata}
            columnSettings={columnSettings}
            selectedAxis={selectedAxis}
          />
        </StylingLabel>
      </div>

      {!isMetricChart && (
        <div className={cn(className, 'h-full')}>
          <SelectAxis {...props} />
        </div>
      )}

      {isMetricChart && (
        <StylingMetric
          className={className}
          columnLabelFormats={columnLabelFormats}
          metricColumnId={metricColumnId}
          metricHeader={metricHeader}
          metricSubHeader={metricSubHeader}
          metricValueAggregate={metricValueAggregate}
          columnMetadata={columnMetadata}
          rowCount={rowCount}
        />
      )}
    </div>
  );
};
