import { MetricController } from '@/controllers/MetricController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';
import { timeout } from '@/lib';

export default async function Page(props: {
  params: Promise<{ chatId: string; metricId: string }>;
}) {
  const params = await props.params;

  const { chatId, metricId } = params;

  return <div>HERE!</div>;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
