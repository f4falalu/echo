import { createStyles } from 'antd-style';
import React, { useMemo } from 'react';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartHeader } from './MetricViewChartHeader';
import { useMetricIndividual, useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from 'ahooks';
import { inputHasText } from '@/utils/text';
import { MetricChartEvaluation } from './MetricChartEvaluation';
import { ChartType } from '@/components/charts/interfaces/enum';
import { AnimatePresence, motion } from 'framer-motion';

export const MetricViewChart: React.FC<{ metricId: string }> = React.memo(({ metricId }) => {
  const { styles, cx } = useStyles();
  const onUpdateMetric = useBusterMetricsIndividualContextSelector((x) => x.onUpdateMetric);
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
      onUpdateMetric({
        title
      });
    }
  });

  return (
    <div
      className={cx(
        styles.container,
        'm-5 flex h-full flex-col justify-between space-y-3.5',
        'overflow-hidden'
      )}>
      <MetricViewChartCard loadingData={loadingData} errorData={errorData} isTable={isTable}>
        <MetricViewChartHeader
          className="px-4"
          title={title}
          description={description}
          timeFrame={time_frame}
          onSetTitle={onSetTitle}
        />
        <div className={cx(styles.divider)} />
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
  const { styles, cx } = useStyles();

  const cardClass = useMemo(() => {
    if (loadingData || errorData) return 'h-full max-h-[600px]';
    if (isTable) return '';
    return 'h-full max-h-[600px]';
  }, [isTable, loadingData, errorData]);

  return <div className={cx(styles.chartCard, cardClass, 'flex flex-col')}>{children}</div>;
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

const useStyles = createStyles(({ css, token }) => ({
  container: css``,
  chartCard: css`
    border-radius: ${token.borderRadiusLG}px;
    border: 0.5px solid ${token.colorBorder};
    background-color: ${token.colorBgContainer};
    overflow: hidden;
  `,
  divider: css`
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));
