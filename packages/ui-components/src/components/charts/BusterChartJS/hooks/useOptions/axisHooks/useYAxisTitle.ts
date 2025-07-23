import { useMemo } from 'react';
import type { BusterChartProps } from '@/api/asset_interfaces/metric/charts';
import { formatLabel } from '@/lib/columnFormatter';
import { truncateWithEllipsis } from '../../../../commonHelpers/titleHelpers';
import type { ChartEncodes } from '@buster/server-shared/metrics';
import { AXIS_TITLE_SEPARATOR } from '@/lib/axisFormatter';

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
