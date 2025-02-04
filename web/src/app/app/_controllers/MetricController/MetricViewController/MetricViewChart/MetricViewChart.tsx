import { createStyles } from 'antd-style';
import React, { useMemo } from 'react';
import { MetricViewChartContent } from './MetricViewChartContent';
import { MetricViewChartHeader } from './MetricViewChartHeader';
import { useBusterMetricIndividual, useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from 'ahooks';
import { inputHasText } from '@/utils/text';
import { MetricChartEvaluation } from './MetricChartEvaluation';
import { ChartType } from '@/components/charts/interfaces/enum';

export const MetricViewChart: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  const { styles, cx } = useStyles();
  const onUpdateMetric = useBusterMetricsContextSelector((x) => x.onUpdateMetric);
  const { metric, metricData } = useBusterMetricIndividual({ metricId });
  const { title, description, time_frame, evaluation_score, evaluation_summary } = metric;
  const isTable = metric.chart_config.selectedChartType === ChartType.Table;

  const loadingData = !metricData.fetched;
  const errorData = !!metricData.error;

  const cardClass = useMemo(() => {
    if (loadingData || errorData) return 'h-full max-h-[600px]';
    if (isTable) return '';
    return 'h-full max-h-[600px]';
  }, [isTable, loadingData, errorData]);

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
      <div className={cx(styles.chartCard, cardClass, 'flex flex-col')}>
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
          metricData={metricData.data}
          dataMetadata={metricData.data_metadata}
          fetchedData={metricData.fetched}
          errorMessage={metricData.error}
        />
      </div>

      <MetricChartEvaluation
        evaluationScore={evaluation_score}
        evaluationSummary={evaluation_summary}
      />
    </div>
  );
});

MetricViewChart.displayName = 'MetricViewChart';

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
