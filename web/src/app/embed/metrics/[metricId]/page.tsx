import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart/MetricViewChart';

export default function EmbedMetricsPage({ params }: { params: { metricId: string } }) {
  const { metricId } = params;

  return <MetricViewChart metricId={metricId} readOnly={true} cardClassName="max-h-screen!" />;
}
