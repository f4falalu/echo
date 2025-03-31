import React, { useMemo } from 'react';
import {
  BusterChartComponentProps,
  BusterChartRenderComponentProps
} from './interfaces/chartComponentInterfaces';
import { BusterChartJS } from './BusterChartJS';
import { useDatasetOptions } from './chartHooks';

export const BusterChartComponent: React.FC<BusterChartRenderComponentProps> = ({
  data: dataProp,
  barSortBy,
  pieMinimumSlicePercentage,
  trendlines,
  ...props
}) => {
  const { barGroupType, lineGroupType, columnLabelFormats, selectedChartType, selectedAxis } =
    props;

  const {
    datasetOptions,
    dataTrendlineOptions,
    y2AxisKeys,
    yAxisKeys,
    tooltipKeys,
    hasMismatchedTooltipsAndMeasures
  } = useDatasetOptions({
    data: dataProp,
    selectedAxis,
    barSortBy,
    selectedChartType,
    pieMinimumSlicePercentage,
    columnLabelFormats,
    barGroupType,
    lineGroupType,
    trendlines
  });

  console.log('DATASET OPTIONS', datasetOptions);
  console.log('TOOLTIP KEYS', tooltipKeys);

  const chartProps: BusterChartComponentProps = useMemo(
    () => ({
      ...props,
      datasetOptions,
      pieMinimumSlicePercentage,
      dataTrendlineOptions,
      y2AxisKeys,
      yAxisKeys,
      tooltipKeys,
      hasMismatchedTooltipsAndMeasures
    }),
    [
      props,
      pieMinimumSlicePercentage,
      datasetOptions,
      dataTrendlineOptions,
      y2AxisKeys,
      yAxisKeys,
      hasMismatchedTooltipsAndMeasures,
      tooltipKeys
    ]
  );

  return <BusterChartJS {...chartProps} />;
};
