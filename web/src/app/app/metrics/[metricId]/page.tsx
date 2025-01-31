import { getAppSplitterLayout } from '@/components/layout';
import { AppAssetCheckLayout } from '../../_layouts/AppAssetCheckLayout';
import { AppContentHeader } from '../../../../components/layout/AppContentHeader';

export default async function ThreadsPage({
  params: { metricId },
  searchParams
}: {
  params: {
    metricId: string;
  };
  searchParams: { embed?: string };
}) {
  const metricLayout = await getAppSplitterLayout('metric', ['auto', '360px']);
  const embedView = searchParams.embed === 'true';

  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <></>
      {/* {!embedView && (
        <AppContentHeader>
          <ThreadControllerHeader metricId={metricId} />
        </AppContentHeader>
      )}
      <ThreadContentController
        metricLayout={metricLayout}
        metricId={metricId}
        chartOnlyView={embedView}
      /> */}
    </AppAssetCheckLayout>
  );
}
