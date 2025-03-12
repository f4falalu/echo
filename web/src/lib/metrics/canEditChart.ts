import { BusterMetricData, BusterChartConfigProps } from '@/api/asset_interfaces/metric';
import isEmpty from 'lodash/isEmpty';
import { isNumericColumnType } from '../messages';

export const canEditChart = (
  metricId: string | undefined | null,
  isFetchedMetricData: boolean,
  metricData: BusterMetricData | undefined,
  columnLabelFormats: BusterChartConfigProps['columnLabelFormats']
): boolean => {
  return (
    !!metricId &&
    !isFetchedMetricData &&
    !isEmpty(metricData?.data) &&
    !columnLabelFormats &&
    !!Object.values(columnLabelFormats! || {}).some((column) =>
      isNumericColumnType(column.columnType)
    )
  );
};
