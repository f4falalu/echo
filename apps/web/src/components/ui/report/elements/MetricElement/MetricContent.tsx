import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { MetricCard } from '@/components/ui/metric';
import { useInViewport } from '@/hooks/useInViewport';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import React, { useMemo, useRef } from 'react';
import { useMetricContentThreeDotMenuItems } from './useMetricContentThreeDotMenuItems';
import { useFocused, useSelected } from 'platejs/react';
import { cn } from '@/lib/utils';

export const MetricContent = React.memo(
  ({
    metricId,
    metricVersionNumber,
    isExportMode = false,
    readOnly = false
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    readOnly?: boolean;
    isExportMode?: boolean;
  }) => {
    const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const reportId = useChatLayoutContextSelector((x) => x.reportId) || '';
    const reportVersionNumber = useChatLayoutContextSelector((x) => x.reportVersionNumber);
    const ref = useRef<HTMLDivElement>(null);
    const isSelected = useSelected();
    const isFocused = useFocused();

    const [inViewport] = useInViewport(ref, {
      threshold: 0.33
    });
    const renderChart = inViewport || isExportMode;

    const {
      data: metric,
      isFetched: isFetchedMetric,
      error: metricError
    } = useGetMetric(
      {
        id: metricId,
        versionNumber: metricVersionNumber
      },
      { enabled: !!metricId }
    );
    const {
      data: metricData,
      isFetched: isFetchedMetricData,
      error: metricDataError
    } = useGetMetricData({
      id: metricId,
      versionNumber: metricVersionNumber
    });

    const link = useMemo(() => {
      return assetParamsToRoute({
        type: 'metric',
        chatId,
        assetId: metricId,
        reportId,
        metricId,
        versionNumber: metricVersionNumber || undefined
      });
    }, [chatId, reportId, metricId, metricVersionNumber]);

    const threeDotMenuItems = useMetricContentThreeDotMenuItems({
      metricId,
      metricVersionNumber,
      reportId,
      reportVersionNumber,
      chatId
    });

    const error: string | undefined =
      metric?.error || metricDataError?.message || metricError?.message || undefined;

    return (
      <MetricCard
        className={cn('transition-all duration-200', {
          'ring-ring ring-1 ring-offset-3': isSelected && isFocused
        })}
        ref={ref}
        metricLink={link}
        animate={!isExportMode}
        metricId={metricId}
        readOnly={readOnly}
        isDragOverlay={false}
        metric={metric}
        metricData={metricData}
        renderChart={renderChart}
        loading={(!isFetchedMetric || !isFetchedMetricData) && !metricError}
        error={error}
        threeDotMenuItems={threeDotMenuItems}
      />
    );
  }
);

MetricContent.displayName = 'MetricContent';
