import { MetricController } from '@/controllers/MetricController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function MetricPage(props: {
  params: Promise<{ metricId: string; dashboardId: string }>;
}) {
  const params = await props.params;
  const { metricId, dashboardId } = params;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
