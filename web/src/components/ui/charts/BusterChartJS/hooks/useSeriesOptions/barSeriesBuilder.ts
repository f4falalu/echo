import type { ChartProps } from '../../core';
import { SeriesBuilderProps } from './interfaces';
import { LabelBuilderProps } from './useSeriesOptions';
import { formatChartLabelDelimiter, formatYAxisLabel, yAxisSimilar } from '../../../commonHelpers';
import { dataLabelFontColorContrast, formatBarAndLineDataLabel } from '../../helpers';
import { BarElement } from 'chart.js';
import { Context } from 'chartjs-plugin-datalabels';
import { defaultLabelOptionConfig } from '../useChartSpecificOptions/labelOptionConfig';
import type { Options } from 'chartjs-plugin-datalabels/types/options';
import { DEFAULT_CHART_LAYOUT } from '../../ChartJSTheme';
import { extractFieldsFromChain } from '../../../chartHooks';

export const barSeriesBuilder = ({
  selectedDataset,
  allYAxisKeysIndexes,
  colors,
  columnSettings,
  columnLabelFormats,
  xAxisKeys,
  barShowTotalAtTop,
  allY2AxisKeysIndexes,
  ...rest
}: SeriesBuilderProps): ChartProps<'bar'>['data']['datasets'] => {
  const dataLabelOptions: Options['labels'] = {};

  if (barShowTotalAtTop && (allYAxisKeysIndexes.length > 1 || allY2AxisKeysIndexes?.length > 0)) {
    const yAxis = allYAxisKeysIndexes.map((yAxis) => {
      const key = extractFieldsFromChain(yAxis.name).at(-1)?.key!;
      return key;
    });

    let hasBeenDrawn = false;

    dataLabelOptions.stackTotal = {
      display: function (context) {
        // Reset the global rotation flag when processing the first data point
        if (context.dataIndex === 0 && context.datasetIndex === 0) {
          context.chart.$barDataLabelsGlobalRotation = false;
          context.chart.$barDataLabelsUpdateInProgress = false;
        }

        const chart = context.chart;
        const shownDatasets = context.chart.data.datasets.filter(
          (dataset, index) =>
            !dataset.hidden &&
            !dataset.isTrendline &&
            //this means that it is hidden via the legend
            !chart.getDatasetMeta(index).hidden
        );
        const canDisplay = context.datasetIndex === shownDatasets.length - 1;
        if (canDisplay && !hasBeenDrawn) {
          const chartLayout = context.chart.options.layout;
          const padding = { ...DEFAULT_CHART_LAYOUT.padding, top: 24 };
          context.chart.options.layout = { ...chartLayout, padding };
          //use setTimeout to ensure that the chart data label almost always overflows.
          requestAnimationFrame(() => {
            if (!context.chart.$barDataLabelsUpdateInProgress) {
              context.chart.$barDataLabelsUpdateInProgress = true;
              console.log('updating');
              context.chart.update('none'); //this is hack because the chart data label almost always overflows

              // Reset the flag after the update completes
              setTimeout(() => {
                context.chart.$barDataLabelsUpdateInProgress = false;
              }, 100);
            }
          });
          hasBeenDrawn = true;
        }
        return canDisplay;
      },
      formatter: function (_, context) {
        const canUseSameYFormatter = yAxisSimilar(yAxis, columnLabelFormats);
        const value = context.chart.$totalizer.stackTotals[context.dataIndex];
        return formatYAxisLabel(
          value,
          yAxis,
          canUseSameYFormatter,
          columnLabelFormats,
          false,
          false
        );
      },
      anchor: 'end',
      align: 'end',
      clamp: true,
      clip: false,
      z: 1000,
      ...defaultLabelOptionConfig
    } as NonNullable<Options['labels']>['stackTotal'];
  }

  return allYAxisKeysIndexes.map<ChartProps<'bar'>['data']['datasets'][number]>(
    (yAxisItem, index) => {
      return barBuilder({
        selectedDataset,
        colors,
        columnSettings,
        columnLabelFormats,
        yAxisItem,
        index,
        xAxisKeys,
        dataLabelOptions
      });
    }
  );
};

declare module 'chart.js' {
  interface Chart {
    $barDataLabels: Record<number, Record<number, string>>;
    $barDataLabelsGlobalRotation: boolean;
    $barDataLabelsUpdateInProgress: boolean;
  }
}

const TEXT_WIDTH_BUFFER = 4;

export const barBuilder = ({
  selectedDataset,
  colors,
  columnSettings,
  columnLabelFormats,
  yAxisItem,
  index,
  yAxisID,
  order,
  xAxisKeys,
  dataLabelOptions
}: Pick<
  SeriesBuilderProps,
  'selectedDataset' | 'colors' | 'columnSettings' | 'columnLabelFormats'
> & {
  yAxisItem: SeriesBuilderProps['allYAxisKeysIndexes'][number];
  index: number;
  yAxisID?: string;
  order?: number;
  xAxisKeys: string[];
  dataLabelOptions?: Options['labels'];
}): ChartProps<'bar'>['data']['datasets'][number] => {
  const yKey = extractFieldsFromChain(yAxisItem.name).at(-1)?.key!;
  const columnSetting = columnSettings[yKey];
  const columnLabelFormat = columnLabelFormats[yKey];
  const usePercentage = !!columnSetting?.showDataLabelsAsPercentage;
  const showLabels = !!columnSetting?.showDataLabels;

  return {
    type: 'bar',
    label: yAxisItem.name,
    yAxisID: yAxisID || 'y',
    order,
    data: selectedDataset.source.map((item) => item[yAxisItem.index] as number),
    backgroundColor: colors[index % colors.length],
    borderRadius: (columnSetting?.barRoundness || 0) / 2,
    xAxisKeys,
    datalabels: {
      clamp: false,
      clip: false,
      labels: {
        barTotal: {
          display: (context) => {
            // Initialize the global rotation flag if it doesn't exist
            if (context.chart.$barDataLabelsGlobalRotation === undefined) {
              context.chart.$barDataLabelsGlobalRotation = false;
              context.chart.$barDataLabelsUpdateInProgress = false;
            }

            // First dataset - analyze all data points to determine if any need rotation
            if (index === 0 && context.dataIndex === 0) {
              // Reset the rotation flag at the start of each render cycle
              context.chart.$barDataLabelsGlobalRotation = false;

              // Analyze all datasets and datapoints in this first call
              const checkAllLabelsForRotation = () => {
                const datasets = context.chart.data.datasets;
                const needsGlobalRotation = datasets.some((dataset, datasetIndex) => {
                  if (dataset.type !== 'bar') return false;

                  return Array.from({ length: dataset.data.length }).some((_, dataIndex) => {
                    const value = dataset.data[dataIndex] as number;
                    if (!value) return false;

                    // Get dimensions for this data point
                    const meta = context.chart.getDatasetMeta(datasetIndex);
                    if (!meta || !meta.data[dataIndex]) return false;

                    const barElement = meta.data[dataIndex] as BarElement;
                    const { width: barWidth } = barElement.getProps(['width'], true);

                    // Only proceed if bar is visible and has reasonable width
                    if (barWidth < 13) return false;

                    // Check if formatted value would need rotation
                    const formattedValue = formatBarAndLineDataLabel(
                      value,
                      { ...context, datasetIndex, dataIndex } as Context,
                      false, // We're just checking width, not actual formatting
                      columnLabelFormat
                    );

                    const { width: textWidth } = context.chart.ctx.measureText(formattedValue);
                    return textWidth > barWidth - TEXT_WIDTH_BUFFER;
                  });
                });

                if (needsGlobalRotation) {
                  context.chart.$barDataLabelsGlobalRotation = true;

                  // Schedule update after all display calculations
                  if (!context.chart.$barDataLabelsUpdateInProgress) {
                    context.chart.$barDataLabelsUpdateInProgress = true;
                    setTimeout(() => {
                      context.chart.update('none');
                      setTimeout(() => {
                        context.chart.$barDataLabelsUpdateInProgress = false;
                      }, 100);
                    }, 0);
                  }
                }
              };

              // Run rotation analysis immediately
              checkAllLabelsForRotation();
            }

            const rawValue = context.dataset.data[context.dataIndex] as number;
            if (!showLabels || !rawValue) return false;

            const { barWidth, barHeight } = getBarDimensions(context);
            if (barWidth < 13) return false;

            const formattedValue = formatBarAndLineDataLabel(
              rawValue,
              context,
              usePercentage,
              columnLabelFormat
            );

            // Get text width for this specific label
            const { width: textWidth } = context.chart.ctx.measureText(formattedValue);

            // Use the global rotation setting
            const rotation = context.chart.$barDataLabelsGlobalRotation ? -90 : 0;

            // Check if this label can be displayed even with rotation
            if (rotation === -90 && textWidth > barHeight - TEXT_WIDTH_BUFFER) {
              return false;
            }

            // Store only the formatted value, rotation is handled globally
            setBarDataLabelsManager(context, formattedValue);

            if (barHeight < 16) return false;
            return 'auto';
          },
          formatter: (_, context) => {
            return context.chart.$barDataLabels?.[context.datasetIndex]?.[context.dataIndex] || '';
          },
          rotation: (context) => {
            // Always use the global rotation setting
            return context.chart.$barDataLabelsGlobalRotation ? -90 : 0;
          },
          color: dataLabelFontColorContrast,
          borderWidth: 0,
          padding: 1,
          borderRadius: 2.5,
          anchor: 'end',
          align: 'start',
          backgroundColor: ({ datasetIndex, chart }) => {
            const backgroundColor = chart.options.backgroundColor as string[];
            return backgroundColor[datasetIndex];
          }
        },
        ...dataLabelOptions
      }
    } as ChartProps<'bar'>['data']['datasets'][number]['datalabels']
  } as ChartProps<'bar'>['data']['datasets'][number];
};

const setBarDataLabelsManager = (context: Context, formattedValue: string) => {
  const dataIndex = context.dataIndex;
  const datasetIndex = context.datasetIndex;

  context.chart.$barDataLabels = {
    ...context.chart.$barDataLabels,
    [datasetIndex]: {
      ...context.chart.$barDataLabels?.[datasetIndex],
      [dataIndex]: formattedValue
    }
  };
};

const getBarDimensions = (context: Context) => {
  const barElement = context.chart.getDatasetMeta(context.datasetIndex).data[
    context.dataIndex
  ] as BarElement;

  const { width: barWidth, height: barHeight } = barElement.getProps(['width', 'height'], true);
  return { barWidth, barHeight };
};

export const barSeriesBuilder_labels = (props: LabelBuilderProps) => {
  const { dataset, columnLabelFormats } = props;

  return dataset.source.map<string>((item) => {
    return formatChartLabelDelimiter(item[0] as string, columnLabelFormats);
  });
};
