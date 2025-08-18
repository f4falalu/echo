import { JOIN_CHARACTER } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import type { BusterChartProps } from '../BusterChart.types';
import type { DatasetOption } from '../chartHooks';

//NEW LABEL HELPERS

export const formatLabelForDataset = (
  dataset: DatasetOption,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  return dataset.label
    .map<string>((item) => {
      const { key, value } = item;
      const columnLabelFormat = columnLabelFormats[key];
      return formatLabel(value || key, columnLabelFormat, !value);
    })
    .join(JOIN_CHARACTER);
};

export const formatLabelForPieLegend = (
  label: string,
  datasetLabel: string,
  isMultipleYAxis: boolean
) => {
  if (isMultipleYAxis) {
    return [label, datasetLabel].join(JOIN_CHARACTER);
  }
  return label;
};
