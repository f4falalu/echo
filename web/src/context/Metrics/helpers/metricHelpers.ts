import isEmpty from 'lodash/isEmpty';
import { BusterMetricData, IBusterMetric } from '../interfaces';
import { isNumericColumnType } from '@/utils';
import { BusterChartConfigProps } from '@/components/charts';
import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { defaultIBusterMetric } from '../config';

export const canEditChart = (
  metricId: string | undefined | null,
  messageData: BusterMetricData,
  columnLabelFormats: BusterChartConfigProps['columnLabelFormats']
): boolean => {
  return (
    !!metricId &&
    !messageData?.fetching &&
    !!messageData?.fetched &&
    !isEmpty(messageData?.data) &&
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
