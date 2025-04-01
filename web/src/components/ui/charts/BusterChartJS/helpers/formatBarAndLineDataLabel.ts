import { ColumnLabelFormat } from '@/api/asset_interfaces/metric';
import { formatLabel } from '@/lib/columnFormatter';
import type { Context } from 'chartjs-plugin-datalabels';

export const formatBarAndLineDataLabel = (
  value: number,
  context: Context,
  usePercentage: boolean | undefined,
  columnLabelFormat: ColumnLabelFormat
) => {
  if (!usePercentage) {
    return formatLabel(value, columnLabelFormat);
  }

  const shownDatasets = context.chart.data.datasets.filter(
    (dataset) => !dataset.hidden && !dataset.isTrendline
  );
  const hasMultipleDatasets = shownDatasets.length > 1;
  const total: number = hasMultipleDatasets
    ? context.chart.$totalizer.stackTotals[context.dataIndex]
    : context.chart.$totalizer.seriesTotals[context.datasetIndex];
  const percentage = ((value as number) / total) * 100;

  return formatLabel(percentage, {
    ...columnLabelFormat,
    style: 'percent',
    columnType: 'number'
  });
};
