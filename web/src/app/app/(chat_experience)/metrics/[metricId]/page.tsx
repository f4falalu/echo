import { AppAssetCheckLayout } from '@/app/app/_layouts/AppAssetCheckLayout';

export default function MetricPage({
  params: { metricId },
  searchParams: { embed }
}: {
  params: { metricId: string };
  searchParams: { embed?: string };
}) {
  const embedView = embed === 'true';

  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <></>
    </AppAssetCheckLayout>
  );
}

{
  /* <MetricContentController
metricLayout={metricLayout}
metricId={metricId}
chartOnlyView={embedView}
/> */
}
