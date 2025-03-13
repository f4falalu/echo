import React, { useMemo } from 'react';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartHeader } from './MetricViewChartHeader';
import { useMetricIndividual, useUpdateMetric } from '@/api/buster_rest/metrics';
import { useMemoizedFn } from '@/hooks';
import { inputHasText } from '@/lib/text';
import { MetricChartEvaluation } from './MetricChartEvaluation';
import { ChartType } from '@/api/asset_interfaces/metric/charts/enum';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/classMerge';

export const MetricViewChart: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const { mutateAsync: updateMetric } = useUpdateMetric();
  const { metric, metricData, metricDataError, isFetchedMetricData } = useMetricIndividual({
    metricId
  });
  const { title, description, time_frame, evaluation_score, evaluation_summary } = metric;
  const isTable = metric.chart_config.selectedChartType === ChartType.Table;

  const loadingData = !isFetchedMetricData;
  const errorData = !!metricDataError;
  const showEvaluation = !!evaluation_score && !!evaluation_summary;

  const onSetTitle = useMemoizedFn((title: string) => {
    if (inputHasText(title)) {
      updateMetric({
        id: metricId,
        title
      });
    }
  });

  return (
    <div className={cn('m-5 flex h-full flex-col justify-between space-y-3.5', 'overflow-hidden')}>
      <MetricViewChartCard loadingData={loadingData} errorData={errorData} isTable={isTable}>
        <MetricViewChartHeader
          className="px-4"
          title={title}
          description={description}
          timeFrame={time_frame}
          onSetTitle={onSetTitle}
        />
        <div className={'border-border border-b'} />
        <MetricViewChartContent
          chartConfig={metric.chart_config}
          metricData={metricData?.data || []}
          dataMetadata={metricData?.data_metadata}
          fetchedData={isFetchedMetricData}
          errorMessage={metricDataError?.message}
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
});

MetricViewChart.displayName = 'MetricViewChart';

const MetricViewChartCard: React.FC<{
  children: React.ReactNode;
  loadingData: boolean;
  errorData: boolean;
  isTable: boolean;
}> = ({ children, loadingData, errorData, isTable }) => {
  const cardClass = useMemo(() => {
    if (loadingData || errorData) return 'h-full max-h-[600px]';
    if (isTable) return '';
    return 'h-full max-h-[600px]';
  }, [isTable, loadingData, errorData]);

  return (
    <div className={cn(cardClass, 'bg-background flex flex-col overflow-hidden rounded border')}>
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
