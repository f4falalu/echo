import { formatLabel } from '@/lib/columnFormatter';
import { ArrayOperations } from '@/lib/math';
import type { ChartConfigProps, ShowLegendHeadline } from '@buster/server-shared/metrics';
import type { BusterChartProps } from '../BusterChart.types';
import type { DatasetOptionsWithTicks } from '../chartHooks';
import type { BusterChartLegendItem } from './interfaces';

export const addLegendHeadlines = (
  legendItems: BusterChartLegendItem[],
  _datasets: DatasetOptionsWithTicks,
  showLegendHeadline: ShowLegendHeadline,
  _columnMetadata: NonNullable<BusterChartProps['columnMetadata']>,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  selectedChartType: ChartConfigProps['selectedChartType'],
  _xAxisKeys: string[]
) => {
  const isScatterChart = selectedChartType === 'scatter';

  if (!showLegendHeadline || isScatterChart) return legendItems;

  const isPieChart = selectedChartType === 'pie';

  legendItems.forEach((item, index) => {
    if (!item.data || !Array.isArray(item.data)) {
      item.headline = {
        type: showLegendHeadline,
        titleAmount: 0
      };
      return;
    }

    if (isPieChart) {
      const result = item.data[index % item.data.length] as number;
      const formattedResult = formatLabel(result, columnLabelFormats[item.yAxisKey]);
      const headline: BusterChartLegendItem['headline'] = {
        type: 'current',
        titleAmount: formattedResult
      };
      item.headline = headline;
      return;
    }

    const arrayOperations = new ArrayOperations(item.data as number[]);

    // Use the mapping to get the correct operation method
    const operationMethod = legendHeadlineToOperation[showLegendHeadline];
    if (!operationMethod) {
      console.warn(`Unknown operation: ${showLegendHeadline}`);
      item.headline = {
        type: showLegendHeadline,
        titleAmount: 0
      };
      return;
    }

    const result = operationMethod(arrayOperations);
    const formattedResult = formatLabel(result, columnLabelFormats[item.yAxisKey]);
    const headline: BusterChartLegendItem['headline'] = {
      type: showLegendHeadline,
      titleAmount: formattedResult
    };
    item.headline = headline;
  });

  return legendItems;
};

const legendHeadlineToOperation: Record<
  'current' | 'average' | 'total' | 'median' | 'min' | 'max',
  (arrayOperations: ArrayOperations) => number
> = {
  current: (arrayOperations) => arrayOperations.last(),
  average: (arrayOperations) => arrayOperations.average(),
  total: (arrayOperations) => arrayOperations.sum(),
  median: (arrayOperations) => arrayOperations.median(),
  min: (arrayOperations) => arrayOperations.min(),
  max: (arrayOperations) => arrayOperations.max()
};
