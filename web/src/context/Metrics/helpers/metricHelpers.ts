import isEmpty from 'lodash/isEmpty';
import type { IBusterMetric, BusterMetricData } from '@/api/asset_interfaces/metric';
import { isNumericColumnType } from '@/lib/messages';
import type { BusterChartConfigProps } from '@/api/asset_interfaces/metric/charts';
import { defaultIBusterMetric } from '../config';

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

export const resolveEmptyMetric = (
  metric: IBusterMetric | undefined,
  metricId: string
): IBusterMetric => {
  if (!metric || !metric?.id) {
    return { ...defaultIBusterMetric, ...metric, id: metricId };
  }
  return metric;
};
