import { AppAssetCheckLayout } from '@/layouts/AppAssetCheckLayout';
import type { Metadata } from 'next';
import { getTitle_server } from '@/api/buster_rest/title';

export default async function MetricLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ metricId: string }>;
}) {
  const { metricId } = await params;

  return (
    <AppAssetCheckLayout assetId={metricId} type="metric">
      {children}
    </AppAssetCheckLayout>
  );
}

// Generate metadata dynamically based on the metric - shared across all child pages
export async function generateMetadata({
  params
}: {
  params: Promise<{ metricId: string }>;
}): Promise<Metadata> {
  const { metricId } = await params;

  try {
    // Fetch the metric title using the server-side request
    const response = await getTitle_server({
      assetId: metricId,
      assetType: 'metric'
    });

    return {
      title: response.title || 'New Metric'
    };
  } catch (error) {
    // Fallback title if the request fails
    console.error('Failed to fetch metric title:', error);
    return {
      title: 'New Metric'
    };
  }
}
