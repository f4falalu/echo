import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';

export default async function MetricLayout({
  children,
  params,
  searchParams
}: {
  children: React.ReactNode;
  params: Promise<{ metricId: string }>;
  searchParams: Promise<{ metric_version_number?: number }>;
}) {
  const { metricId } = await params;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric">
      {children}
    </AppAssetCheckLayout>
  );
}
