import { MetricController } from '@/controllers/MetricController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function MetricPage(props: { params: Promise<{ metricId: string }> }) {
  const [params] = await Promise.all([props.params]);
  const { metricId } = params;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
