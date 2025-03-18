'use client';

import { useGetMetric } from '@/api/buster_rest/metrics';
import { CircleSpinnerLoaderContainer } from '@/components/ui/loaders';
import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart/MetricViewChart';

export default function EmbedMetricsPage({ params }: { params: { metricId: string } }) {
  const { metricId } = params;
  const { data, isFetched, error } = useGetMetric(metricId);

  if (!isFetched) {
    return <CircleSpinnerLoaderContainer className="min-h-screen" />;
  }

  return <MetricViewChart metricId={metricId} readOnly={true} />;
}
