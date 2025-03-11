import { BusterChartTooltip } from '../../../../BusterChartTooltip';
import { type BusterChartProps, ChartType } from '@/api/asset_interfaces/metric/charts';
import React, { useMemo } from 'react';
import type { Chart, TooltipItem, ChartType as ChartJSChartType } from 'chart.js';
import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';
import { barAndLineTooltipHelper } from './barAndLineTooltipHelper';
import { pieTooltipHelper } from './pieTooltipHelper';
import { formatLabel } from '@/lib/columnFormatter';
import { scatterTooltipHelper } from './scatterTooltipHelper';

export const BusterChartJSTooltip: React.FC<{
  chart: Chart;
  dataPoints: TooltipItem<ChartJSChartType>[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  hasCategoryAxis: boolean;
  hasMultipleMeasures: boolean;
  keyToUsePercentage: string[];
}> = ({
  chart,
  dataPoints: dataPointsProp,
  columnLabelFormats,
  selectedChartType,
  hasCategoryAxis,
  keyToUsePercentage,
  hasMultipleMeasures
}) => {
  const isPieChart = selectedChartType === ChartType.Pie;
  const isScatter = selectedChartType === ChartType.Scatter;
  const isLine = selectedChartType === ChartType.Line;
  const isBar = selectedChartType === ChartType.Bar;
  const isPie = selectedChartType === ChartType.Pie;
  const isComboChart = selectedChartType === ChartType.Combo;
  const datasets = chart.data.datasets;
  const dataPoints = dataPointsProp.filter((item) => !item.dataset.isTrendline);

  const title = useMemo(() => {
    if (isScatter) return undefined;

    const dataIndex = dataPoints[0].dataIndex;
    const value = chart.data.labels?.[dataIndex!];
    if (typeof value === 'string') return String(value);

    //THIS IS ONLY FOR LINE CHART WITH A TIME AXIS
    const datasetIndex = dataPoints[0].datasetIndex;
    const dataset = datasets[datasetIndex!];
    const xAxisKeys = (dataset as any).xAxisKeys as string[]; //hacky... TODO look into this
    const key = xAxisKeys.at(0)!;
    const columnLabelFormat = columnLabelFormats[key!];

    return formatLabel(value as number | Date, columnLabelFormat);
  }, [dataPoints, isPie, isScatter, chart]);

  const tooltipItems: ITooltipItem[] = useMemo(() => {
    if (isBar || isLine || isComboChart) {
      const hasMultipleShownDatasets =
        datasets.filter((dataset) => !dataset.hidden && !dataset.isTrendline).length > 1;

      return barAndLineTooltipHelper(
        datasets,
        dataPoints,
        chart,
        columnLabelFormats,
        hasMultipleMeasures,
        keyToUsePercentage,
        hasCategoryAxis,
        hasMultipleShownDatasets
      );
    }

    if (isPieChart) {
      return pieTooltipHelper(datasets, dataPoints, chart, columnLabelFormats, keyToUsePercentage);
    }

    if (isScatter) {
      return scatterTooltipHelper(
        datasets,
        dataPoints,
        columnLabelFormats,
        hasMultipleMeasures,
        hasCategoryAxis
      );
    }

    return [];
  }, []);

  //use mount will not work here because the tooltip is passed to a renderString function
  const busterTooltipNode = document?.querySelector('#buster-chartjs-tooltip')!;
  if (busterTooltipNode) {
    if (tooltipItems.length === 0) {
      (busterTooltipNode as HTMLElement).style.display = 'none';
    } else {
      (busterTooltipNode as HTMLElement).style.display = 'block';
    }
  }

  return <BusterChartTooltip title={title} tooltipItems={tooltipItems} />;
};
