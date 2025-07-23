import { formatLabel } from '@/lib/columnFormatter';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ChartTypeRegistry, TooltipItem } from 'chart.js';
import type { ITooltipItem } from '../../../../BusterChartTooltip/interfaces';

export const scatterTooltipHelper = (
  dataPoints: TooltipItem<keyof ChartTypeRegistry>[],
  columnLabelFormats: NonNullable<ChartConfigProps['columnLabelFormats']>
): ITooltipItem[] => {
  return dataPoints.slice(0, 1).flatMap<ITooltipItem>((dataPoint) => {
    const dataPointDataset = dataPoint.dataset;
    const dataPointDataIndex = dataPoint.dataIndex;
    const tooltipData = dataPointDataset.tooltipData;
    const selectedToolTipData = tooltipData[dataPointDataIndex];

    const title = dataPointDataset.label as string;

    if (!selectedToolTipData) return [];

    return selectedToolTipData.map<ITooltipItem>((item) => {
      return {
        color: dataPointDataset.backgroundColor as string,
        seriesType: 'scatter',
        usePercentage: false,
        formattedLabel: title,
        values: [
          {
            formattedValue: formatLabel(item.value as number, columnLabelFormats[item.key]),
            formattedPercentage: undefined,
            formattedLabel: formatLabel(item.key as string, columnLabelFormats[item.key], true),
          },
        ],
      };
    });
  });
};
