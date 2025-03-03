import isEmpty from 'lodash/isEmpty';
import { IBusterMetric } from '../interfaces';
import { isNumericColumnType } from '@/utils';
import { BusterChartConfigProps } from '@/components/ui/charts';
import { defaultIBusterMetric } from '../config';
import { BusterMetricData } from '@/context/MetricData';

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
