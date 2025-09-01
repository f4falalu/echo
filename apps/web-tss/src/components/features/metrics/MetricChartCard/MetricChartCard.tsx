import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import isEmpty from 'lodash/isEmpty';
import type React from 'react';
import { useMemo } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useSelectedColorPalette } from '@/context/Themes/usePalettes';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { inputHasText } from '@/lib/text';
import { cn } from '@/lib/utils';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartHeader } from './MetricViewChartHeader';

export type MetricChartCardProps = {
  metricId: string;
  versionNumber: number | undefined;
  readOnly?: boolean;
  className?: string;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  headerSecondaryContent: React.ReactNode;
  useHeaderLink?: boolean;
  animate?: boolean;
};

const stableMetricSelect = ({
  chart_config,
  name,
  description,
  time_frame,
  permission,
  version_number,
  versions,
}: BusterMetric) => ({
  name,
  description,
  time_frame,
  permission,
  chart_config,
  version_number,
  versions,
});

export const MetricChartCard: React.FC<MetricChartCardProps> = ({
  metricId,
  versionNumber,
  readOnly = false,
  className,
  useHeaderLink,
  headerSecondaryContent,
  attributes,
  listeners,
  animate = true,
}) => {
  const { data: metric, isFetched: isFetchedMetric } = useGetMetric(
    { id: metricId, versionNumber },
    { select: stableMetricSelect, enabled: true }
  );
  const {
    data: metricData,
    isFetched: isFetchedMetricData,
    error: metricDataError,
  } = useGetMetricData({ id: metricId, versionNumber });

  //data config
  const loadingData = !isFetchedMetricData;
  const hasData = !loadingData && !isEmpty(metricData?.data);
  const errorData = !!metricDataError;

  //metric config
  const { name, description, time_frame } = metric || {};
  const isTable = metric?.chart_config.selectedChartType === 'table';
  const colors = useSelectedColorPalette(metric?.chart_config.colors);
  const { onUpdateMetricName } = useUpdateMetricChart({ metricId });
  const onSetTitle = useMemoizedFn((title: string) => {
    if (inputHasText(title)) {
      onUpdateMetricName({ name: title });
    }
  });

  return (
    <MetricViewChartCardContainer
      loadingData={loadingData}
      hasData={hasData}
      errorData={errorData}
      isTable={isTable}
      className={className}
    >
      <MetricViewChartHeader
        name={name}
        description={description}
        timeFrame={time_frame}
        onSetTitle={onSetTitle}
        readOnly={readOnly}
        headerSecondaryContent={headerSecondaryContent}
        useHeaderLink={useHeaderLink}
        attributes={attributes}
        listeners={listeners}
        metricId={metricId}
        metricVersionNumber={versionNumber}
      />
      <div className={'border-border border-b'} />
      <MetricViewChartContent
        chartConfig={metric ? { ...metric.chart_config, colors } : undefined}
        metricData={metricData?.data || []}
        dataMetadata={metricData?.data_metadata}
        fetchedData={isFetchedMetricData}
        fetchedMetric={isFetchedMetric}
        errorMessage={metricDataError?.message}
        metricId={metricId}
        readOnly={readOnly}
        animate={animate}
      />
    </MetricViewChartCardContainer>
  );
};

const MetricViewChartCardContainer: React.FC<{
  children: React.ReactNode;
  loadingData: boolean;
  hasData: boolean;
  errorData: boolean;
  isTable: boolean;
  className?: string;
}> = ({ children, loadingData, hasData, errorData, isTable, className }) => {
  const cardClass = useMemo(() => {
    if (loadingData || errorData || !hasData) return 'h-full max-h-[600px]';
    if (isTable) return '';
    return 'h-full max-h-[600px]';
  }, [isTable, loadingData, hasData, errorData]);

  return (
    <div
      className={cn(
        'bg-background flex flex-col overflow-hidden rounded border shadow',
        cardClass,
        className
      )}
    >
      {children}
    </div>
  );
};

MetricChartCard.displayName = 'MetricChartCard';
