import { AppAssetCheckLayout } from '../../../../_layouts/AppAssetCheckLayout';
import { getAppSplitterLayout } from '@/components/layout';
import React from 'react';

export default async function DashboardThreadPage({
  params: { metricId }
}: {
  params: {
    metricId: string;
  };
}) {
  const metricLayout = await getAppSplitterLayout('metric', ['auto', '360px']);

  return (
    <AppAssetCheckLayout metricId={metricId} type="metric">
      <></>
      {/* <ThreadContentController threadId={threadId} threadLayout={threadLayout} /> */}
    </AppAssetCheckLayout>
  );
}
