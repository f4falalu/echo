import { formatLabel } from '@/lib/columnFormatter';
import type { BusterChartProps } from '../../BusterChart.types';

export const formatChartLabel = (
  label: string,
  key: string,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>
): string => {
  return formatLabel(label, columnLabelFormats[key], true);
};
