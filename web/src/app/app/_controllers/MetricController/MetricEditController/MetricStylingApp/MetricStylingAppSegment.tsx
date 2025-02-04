import React, { useMemo } from 'react';
import { MetricStylingAppSegments } from './config';
import { SegmentedOptions, SegmentedValue } from 'antd/es/segmented';
import { useMemoizedFn } from 'ahooks';
import { Segmented } from 'antd';
import { createStyles } from 'antd-style';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    border-bottom: 0.5px solid ${token.colorBorder};
  `
}));

export const MetricStylingAppSegment: React.FC<{
  segment: MetricStylingAppSegments;
  setSegment: (segment: MetricStylingAppSegments) => void;
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  className?: string;
}> = React.memo(({ segment, setSegment, selectedChartType, className = '' }) => {
  const { cx, styles } = useStyles();
  const isTable = selectedChartType === 'table';
  const isMetric = selectedChartType === 'metric';
  const disableColors = isTable || isMetric;
  const disableStyling = isTable || isMetric;

  const options: SegmentedOptions = useMemo(
    () => [
      {
        label: MetricStylingAppSegments.VISUALIZE,
        value: MetricStylingAppSegments.VISUALIZE
      },
      {
        label: MetricStylingAppSegments.STYLING,
        value: MetricStylingAppSegments.STYLING,
        disabled: disableStyling
      },
      {
        label: MetricStylingAppSegments.COLORS,
        value: MetricStylingAppSegments.COLORS,
        disabled: disableColors
      }
    ],
    [disableColors, disableStyling]
  );

  const onChangeSegment = useMemoizedFn((value: SegmentedValue) => {
    setSegment(value as MetricStylingAppSegments);
  });

  return (
    <div className={cx(styles.container)}>
      <div className={cx('pb-3', className)}>
        <Segmented block options={options} value={segment} onChange={onChangeSegment} />
      </div>
    </div>
  );
});
MetricStylingAppSegment.displayName = 'MetricStylingAppSegment';
