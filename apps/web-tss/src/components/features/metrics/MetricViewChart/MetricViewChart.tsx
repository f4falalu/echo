import { AnimatePresence, motion } from 'framer-motion';
import isEmpty from 'lodash/isEmpty';
import React, { useMemo } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric';
import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useSelectedColorPalette } from '@/context/Themes/usePalettes';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { inputHasText } from '@/lib/text';
import { MetricChartEvaluation } from './MetricChartEvaluation';
import { MetricDataTruncatedWarning } from './MetricDataTruncatedWarning';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartHeader } from './MetricViewChartHeader';

const stableMetricSelect = ({
  chart_config,
  name,
  description,
  time_frame,
  permission,
  evaluation_score,
  evaluation_summary,
  version_number,
  versions,
}: BusterMetric) => ({
  name,
  description,
  time_frame,
  permission,
  evaluation_score,
  evaluation_summary,
  chart_config,
  version_number,
  versions,
});

export const MetricViewChart: React.FC<{
  metricId: string;
  versionNumber?: number;
  readOnly?: boolean;
  className?: string;
  cardClassName?: string;
}> = React.memo(
  ({ metricId, versionNumber, readOnly = false, className = '', cardClassName = '' }) => {
    const { data: metric, isFetched: isFetchedMetric } = useGetMetric(
      { id: metricId, versionNumber },
      { select: stableMetricSelect, enabled: true }
    );
    const {
      data: metricData,
      isFetched: isFetchedMetricData,
      error: metricDataError,
    } = useGetMetricData({ id: metricId, versionNumber });

    const { onUpdateMetricName } = useUpdateMetricChart({ metricId });
    const { name, description, time_frame, evaluation_score, evaluation_summary } = metric || {};

    const isTable = metric?.chart_config.selectedChartType === 'table';

    const loadingData = !isFetchedMetricData;
    const hasData = !loadingData && !isEmpty(metricData?.data);
    const errorData = !!metricDataError;
    const showEvaluation = !!evaluation_score && !!evaluation_summary;
    const colors = useSelectedColorPalette(metric?.chart_config.colors);

    const onSetTitle = useMemoizedFn((title: string) => {
      if (inputHasText(title)) {
        onUpdateMetricName({ name: title });
      }
    });

    return (
      <div className={cn('flex h-full flex-col justify-between space-y-3.5 p-5', className)}>
        <div className="flex h-full flex-col space-y-3">
          <MetricViewChartCard
            loadingData={loadingData}
            hasData={hasData}
            errorData={errorData}
            isTable={isTable}
            className={cardClassName}
          >
            <MetricViewChartHeader
              className="px-4"
              name={name}
              description={description}
              timeFrame={time_frame}
              onSetTitle={onSetTitle}
              readOnly={readOnly}
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
            />
          </MetricViewChartCard>

          {!!metricData?.has_more_records && <MetricDataTruncatedWarning metricId={metricId} />}
        </div>

        <AnimatePresenceWrapper show={showEvaluation}>
          <MetricChartEvaluation
            evaluationScore={evaluation_score}
            evaluationSummary={evaluation_summary}
          />
        </AnimatePresenceWrapper>
      </div>
    );
  }
);

MetricViewChart.displayName = 'MetricViewChart';

const MetricViewChartCard: React.FC<{
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

MetricViewChartCard.displayName = 'MetricViewChartCard';

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 },
};

const AnimatePresenceWrapper: React.FC<{
  children: React.ReactNode;
  show: boolean;
}> = ({ children, show }) => {
  return (
    <AnimatePresence initial={false}>
      {show && <motion.div {...animation}>{children}</motion.div>}
    </AnimatePresence>
  );
};
