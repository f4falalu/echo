'use client';

import './ChartJSTheme';

import React, { useRef, useState } from 'react';
import { DEFAULT_CHART_CONFIG, DEFAULT_COLUMN_METADATA } from '@/api/asset_interfaces/metric';
import { BusterChartJSLegendWrapper } from './BusterChartJSLegendWrapper';
import { ChartJSOrUndefined } from './core/types';
import { useMemoizedFn, useMount } from '@/hooks';
import { BusterChartJSComponent } from './BusterChartJSComponent';
import type { BusterChartComponentProps } from '../interfaces';

export const BusterChartJS: React.FC<BusterChartComponentProps> = ({
  selectedChartType,
  className = '',
  animate = true,
  colors = DEFAULT_CHART_CONFIG.colors,
  showLegend,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  selectedAxis,
  loading = false,
  showLegendHeadline,
  columnMetadata = DEFAULT_COLUMN_METADATA,
  onChartMounted,
  onInitialAnimationEnd,
  columnSettings = DEFAULT_CHART_CONFIG.columnSettings,
  animateLegend = true,
  ...props
}) => {
  const chartRef = useRef<ChartJSOrUndefined>(null);
  const [chartMounted, setChartMounted] = useState(false);

  const { lineGroupType, pieMinimumSlicePercentage, barGroupType, datasetOptions } = props;

  const onChartReady = useMemoizedFn(() => {
    setChartMounted(true);
    onChartMounted?.();
  });

  const onInitialAnimationEndPreflight = useMemoizedFn(() => {
    onInitialAnimationEnd?.();
  });

  return (
    <BusterChartJSLegendWrapper
      animateLegend={animateLegend}
      loading={loading}
      columnLabelFormats={columnLabelFormats}
      selectedAxis={selectedAxis}
      chartMounted={chartMounted}
      showLegend={showLegend}
      showLegendHeadline={showLegendHeadline}
      className={className}
      selectedChartType={selectedChartType}
      columnSettings={columnSettings}
      columnMetadata={columnMetadata}
      lineGroupType={lineGroupType}
      barGroupType={barGroupType}
      colors={colors}
      chartRef={chartRef}
      datasetOptions={datasetOptions}
      pieMinimumSlicePercentage={pieMinimumSlicePercentage}>
      <BusterChartJSComponent
        ref={chartRef}
        selectedChartType={selectedChartType}
        onChartReady={onChartReady}
        onInitialAnimationEnd={onInitialAnimationEndPreflight}
        selectedAxis={selectedAxis!}
        columnLabelFormats={columnLabelFormats}
        colors={colors}
        columnMetadata={columnMetadata}
        animate={animate}
        columnSettings={columnSettings}
        {...props}
        className={className}
      />
    </BusterChartJSLegendWrapper>
  );
};

BusterChartJS.displayName = 'BusterChartJS';
