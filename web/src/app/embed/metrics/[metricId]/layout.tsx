import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default function EmbedMetricsLayout({
  children,
  params: { metricId }
}: {
  children: React.ReactNode;
  params: { metricId: string };
}) {
  console.log('embed metrics layout');
  return (
    <AppAssetCheckLayout type="metric" metricId={metricId}>
      {children}
    </AppAssetCheckLayout>
  );
}
