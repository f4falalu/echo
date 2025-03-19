import React, { useMemo } from 'react';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartHeader } from './MetricViewChartHeader';
import { useGetMetric, useGetMetricData, useUpdateMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks';
import { inputHasText } from '@/lib/text';
import { MetricChartEvaluation } from './MetricChartEvaluation';
import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';
import { canEdit } from '@/lib/share';

export const MetricViewChart: React.FC<{
  metricId: string;
  readOnly?: boolean;
  className?: string;
  cardClassName?: string;
}> = React.memo(
  ({ metricId, readOnly: readOnlyProp = false, className = '', cardClassName = '' }) => {
    const { data: metric, isFetched: isMetricFetched } = useGetMetric({ id: metricId });
    const {
      data: metricData,
      isFetched: isFetchedMetricData,

      error: metricDataError
    } = useGetMetricData({ id: metricId });

    const { mutateAsync: updateMetric } = useUpdateMetric();
    const { title, description, time_frame, evaluation_score, evaluation_summary } = metric || {};
    const isTable = metric?.chart_config.selectedChartType === ChartType.Table;

    const readOnly = readOnlyProp || !canEdit(metric?.permission);

    const loadingData = !isFetchedMetricData;
    const errorData = !!metricDataError;
    const showEvaluation = !!evaluation_score && !!evaluation_summary;

    const onSetTitle = useMemoizedFn((title: string) => {
      if (updateMetric && inputHasText(title)) {
        updateMetric({
          id: metricId,
          title
        });
      }
    });

    if (!metric) return null;

    return (
      <div className={cn('flex h-full flex-col justify-between space-y-3.5 p-5', className)}>
        <MetricViewChartCard
          loadingData={loadingData}
          errorData={errorData}
          isTable={isTable}
          className={cardClassName}>
          <MetricViewChartHeader
            className="px-4"
            title={title}
            description={description}
            timeFrame={time_frame}
            onSetTitle={onSetTitle}
            readOnly={readOnly}
          />
          <div className={'border-border border-b'} />
          <MetricViewChartContent
            chartConfig={metric.chart_config}
            metricData={metricData?.data || []}
            dataMetadata={metricData?.data_metadata}
            fetchedData={isFetchedMetricData}
            errorMessage={metricDataError?.message}
            metricId={metricId}
            readOnly={readOnly}
          />
        </MetricViewChartCard>

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
  errorData: boolean;
  isTable: boolean;
  className?: string;
}> = ({ children, loadingData, errorData, isTable, className }) => {
  const cardClass = useMemo(() => {
    if (loadingData || errorData) return 'h-full max-h-[600px]';
    if (isTable) return '';
    return 'h-full max-h-[600px]';
  }, [isTable, loadingData, errorData]);

  return (
    <div
      className={cn(
        'bg-background flex flex-col overflow-hidden rounded border shadow',
        cardClass,
        className
      )}>
      {children}
    </div>
  );
};

const animation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.4 }
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
