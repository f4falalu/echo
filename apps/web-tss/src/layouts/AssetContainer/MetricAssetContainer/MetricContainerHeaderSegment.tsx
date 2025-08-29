import { type ParsedLocation, useLocation } from '@tanstack/react-router';
import React, { useCallback, useMemo } from 'react';
import { AppSegmented } from '@/components/ui/segmented';
import { useIsMetricReadOnly } from '@/context/Metrics/useIsMetricReadOnly';

interface MetricContainerHeaderSegmentProps {
  metricId: string;
  metric_version_number: number | undefined;
}

export const MetricContainerHeaderSegment: React.FC<MetricContainerHeaderSegmentProps> = React.memo(
  (props) => {
    const { metricId, metric_version_number } = props;

    const { isFetched, isError } = useIsMetricReadOnly({
      metricId,
    });

    if (!isFetched || isError) return null;

    return <MetricSegments {...props} />;
  }
);

MetricContainerHeaderSegment.displayName = 'MetricContainerHeaderSegment';

type MetricView = 'chart' | 'results' | 'sql';

const MetricSegments: React.FC<MetricContainerHeaderSegmentProps> = React.memo(() => {
  const location = useLocation({
    select: useCallback((location: ParsedLocation) => {
      // Get the last value after a slash in the pathname
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const lastSegment = pathSegments[pathSegments.length - 1] || '';
      return lastSegment;
    }, []),
  });

  const selectedView: MetricView = useMemo(() => {
    if (location === 'chart') return 'chart';
    if (location === 'results') return 'results';
    if (location === 'sql') return 'sql';
    return 'chart';
  }, [location]);

  return (
    <AppSegmented
      type="button"
      from={'./' as unknown as '/app/metrics/$metricId'}
      options={[
        {
          label: 'Chart',
          value: 'chart' satisfies MetricView,
          link: {
            to: '../chart' as './chart', //not super happy about this, but I am lazy
          },
        },
        {
          label: 'Results',
          value: 'results' satisfies MetricView,
          link: {
            to: '../results' as './results',
          },
        },
        {
          label: 'SQL',
          value: 'sql' satisfies MetricView,
          link: {
            to: '../sql' as './sql',
          },
        },
      ]}
      value={selectedView}
    />
  );
});

MetricSegments.displayName = 'MetricSegments';
