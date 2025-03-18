import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function EmbedMetricsLayout({
  children,
  params: { metricId }
}: {
  children: React.ReactNode;
  params: { metricId: string };
}) {
  return (
    <AppAssetCheckLayout type="metric" assetId={metricId}>
      {children}
    </AppAssetCheckLayout>
  );
}
