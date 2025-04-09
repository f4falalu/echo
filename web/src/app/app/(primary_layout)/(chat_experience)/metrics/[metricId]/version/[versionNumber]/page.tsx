import { MetricViewChart } from '@/controllers/MetricController/MetricViewChart';

export default async function MetricVersionPage({
  params
}: {
  params: Promise<{ versionNumber: string; metricId: string }>;
}) {
  const { versionNumber, metricId } = await params;
  return <MetricViewChart metricId={metricId} />;
}
