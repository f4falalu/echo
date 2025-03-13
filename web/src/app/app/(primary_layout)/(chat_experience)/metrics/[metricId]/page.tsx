import { MetricController } from '@/controllers/MetricController';
import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function MetricPage(props: {
  params: Promise<{ metricId: string }>;

  searchParams: Promise<{ embed?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { embed } = searchParams;
  const { metricId } = params;

  const embedView = embed === 'true';

  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
