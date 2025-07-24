import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';
import { formatLabel } from '@/lib/columnFormatter';
import type { ChartEncodes } from '@buster/server-shared/metrics';
import { useMemo } from 'react';
import type { BusterChartProps } from '../../../../BusterChart.types';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';

interface UseYAxisTitleProps {
  yAxis: string[];
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>;
  isSupportedChartForAxisTitles: boolean;
  yAxisAxisTitle: BusterChartProps['yAxisAxisTitle'];
  yAxisShowAxisTitle: BusterChartProps['yAxisShowAxisTitle'];
  selectedAxis: ChartEncodes;
}

export const useYAxisTitle = ({
  yAxis,
  columnLabelFormats,
  isSupportedChartForAxisTitles,
  yAxisAxisTitle,
  yAxisShowAxisTitle,
  selectedAxis
}: UseYAxisTitleProps) => {
  const yAxisColumnLabelFormats = useMemo(() => {
    return yAxis.map((y) => columnLabelFormats[y]);
  }, [yAxis, columnLabelFormats]);

  const yAxisTitle: string = useMemo(() => {
    if (!isSupportedChartForAxisTitles || !yAxisShowAxisTitle) return '';

    return truncateWithEllipsis(
      yAxisAxisTitle ||
        selectedAxis.y
          .map((y) => formatLabel(y, columnLabelFormats[y], true))
          .join(AXIS_TITLE_SEPARATOR)
    );
  }, [yAxisAxisTitle, isSupportedChartForAxisTitles, yAxisShowAxisTitle, yAxisColumnLabelFormats]);

  return yAxisTitle;
};
