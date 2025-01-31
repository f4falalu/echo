import isEmpty from 'lodash/isEmpty';
import { BusterMetricData, IBusterMetric } from '../interfaces';
import { isNumericColumnType } from '@/utils';
import { BusterChartConfigProps } from '@/components/charts';
import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import { defaultIBusterMetric } from '../config';

export const metricsArrayToRecord = (threads: BusterMetricListItem[]) => {
  return threads.reduce(
    (acc, thread) => {
      acc[thread.id] = thread;
      return acc;
    },
    {} as Record<string, BusterMetricListItem>
  );
};

export const canEditChart = (
  threadId: string | undefined | null,
  messageData: BusterMetricData,
  columnLabelFormats: BusterChartConfigProps['columnLabelFormats']
): boolean => {
  return (
    !!threadId &&
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
    return { ...defaultIBusterMetric, id: metricId };
  }
  return metric;
};

export const createFilterRecord = ({
  filters = [],
  admin_view
}: {
  filters?: VerificationStatus[];
  admin_view: boolean;
}): string => {
  const filtersString = filters.join(',');
  const adminViewString = admin_view ? 'admin_view' : '';
  return filtersString + adminViewString;
};
