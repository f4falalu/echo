import { MetricController } from '@appControllers/MetricController';
import { AppAssetCheckLayout } from '@appLayouts/AppAssetCheckLayout';

export default function Page({
  params: { chatId, metricId }
}: {
  params: { chatId: string; metricId: string };
}) {
  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <MetricController metricId={metricId} />
    </AppAssetCheckLayout>
  );
}
