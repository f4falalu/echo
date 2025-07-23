import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import type { ChartEncodes } from '@buster/server-shared/metrics';
import { useMemo } from 'react';
import type { BusterChartProps } from '../../../../BusterChart.types';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';

interface UseXAxisTitleProps {
  xAxis: string[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  isSupportedChartForAxisTitles: boolean;
  xAxisAxisTitle: BusterChartProps['xAxisAxisTitle'];
  xAxisShowAxisTitle: BusterChartProps['xAxisShowAxisTitle'];
  selectedAxis: ChartEncodes;
}

export const useXAxisTitle = ({
  xAxis,
  columnLabelFormats,
  isSupportedChartForAxisTitles,
  xAxisAxisTitle,
  xAxisShowAxisTitle,
  selectedAxis
}: UseXAxisTitleProps): string => {
  const xAxisColumnLabelFormats = useMemo(() => {
    return xAxis.map((x) => columnLabelFormats[x]);
  }, [xAxis, isSupportedChartForAxisTitles, columnLabelFormats]);

  const xAxisTitle = useMemo(() => {
    if (!isSupportedChartForAxisTitles || xAxisAxisTitle === '' || !xAxisShowAxisTitle) return '';

    const title =
      xAxisAxisTitle ||
      selectedAxis.x
        .map((x) => formatLabel(x, columnLabelFormats[x], true))
        .join(AXIS_TITLE_SEPARATOR);

    return truncateWithEllipsis(title);
  }, [
    xAxisAxisTitle,
    isSupportedChartForAxisTitles,
    xAxisShowAxisTitle,
    xAxis,
    xAxisColumnLabelFormats
  ]);

  return xAxisTitle;
};
