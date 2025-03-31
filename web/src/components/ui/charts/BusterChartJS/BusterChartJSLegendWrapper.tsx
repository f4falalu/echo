import React from 'react';
import { type BusterChartProps, type ChartEncodes } from '@/api/asset_interfaces/metric/charts';
import { ChartJSOrUndefined } from './core/types';
import { useBusterChartJSLegend } from './hooks';
import { BusterChartLegendWrapper } from '../BusterChartLegend/BusterChartLegendWrapper';
import { DatasetOption } from '../chartHooks';

interface BusterChartJSLegendWrapperProps {
  children: React.ReactNode;
  animateLegend: boolean;
  loading: boolean;
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  selectedAxis: ChartEncodes | undefined;
  chartMounted: boolean;
  showLegend: BusterChartProps['showLegend'] | undefined;
  showLegendHeadline: BusterChartProps['showLegendHeadline'];
  className: string | undefined;
  selectedChartType: NonNullable<BusterChartProps['selectedChartType']>;
  columnSettings: NonNullable<BusterChartProps['columnSettings']>;
  columnMetadata: NonNullable<BusterChartProps['columnMetadata']>;
  lineGroupType: BusterChartProps['lineGroupType'];
  barGroupType: BusterChartProps['barGroupType'];
  colors: NonNullable<BusterChartProps['colors']>;
  chartRef: React.RefObject<ChartJSOrUndefined | null>;
  datasetOptions: DatasetOption[];
  pieMinimumSlicePercentage: NonNullable<BusterChartProps['pieMinimumSlicePercentage']>;
}

export const BusterChartJSLegendWrapper = React.memo<BusterChartJSLegendWrapperProps>(
  ({
    children,
    className = '',
    loading,
    showLegend: showLegendProp,
    chartMounted,
    columnLabelFormats,
    selectedAxis,
    chartRef,
    selectedChartType,
    animateLegend,
    columnSettings,
    columnMetadata,
    showLegendHeadline,
    lineGroupType,
    barGroupType,
    colors,
    datasetOptions,
    pieMinimumSlicePercentage
  }) => {
    const {
      renderLegend,
      legendItems,
      inactiveDatasets,
      onHoverItem,
      onLegendItemClick,
      onLegendItemFocus,
      showLegend,
      isUpdatingChart
    } = useBusterChartJSLegend({
      selectedAxis,
      columnLabelFormats,
      chartMounted,
      chartRef,
      selectedChartType,
      showLegend: showLegendProp,
      showLegendHeadline,
      columnSettings,
      columnMetadata,
      lineGroupType,
      barGroupType,
      colors,
      loading,
      datasetOptions,
      pieMinimumSlicePercentage
    });

    return (
      <BusterChartLegendWrapper
        className={className}
        animateLegend={animateLegend}
        renderLegend={renderLegend}
        legendItems={legendItems}
        showLegend={showLegend}
        showLegendHeadline={showLegendHeadline}
        inactiveDatasets={inactiveDatasets}
        onHoverItem={onHoverItem}
        onLegendItemClick={onLegendItemClick}
        onLegendItemFocus={onLegendItemFocus}>
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          {isUpdatingChart && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"></div>
            </div>
          )}
          {children}
        </div>
      </BusterChartLegendWrapper>
    );
  }
);

BusterChartJSLegendWrapper.displayName = 'BusterChartJSLegendWrapper';
