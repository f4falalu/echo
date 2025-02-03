import { MetricController } from '@appControllers/MetricController';
import { AppAssetCheckLayout } from '@appLayouts/AppAssetCheckLayout';

export default function MetricPage({
  params: { metricId },
  searchParams: { embed }
}: {
  params: { metricId: string };
  searchParams: { embed?: string };
}) {
  const embedView = embed === 'true';

  return (
    // <AppAssetCheckLayout metricId={metricId} type="metric">
    <MetricController metricId={metricId} />
    // </AppAssetCheckLayout>
  );
}
