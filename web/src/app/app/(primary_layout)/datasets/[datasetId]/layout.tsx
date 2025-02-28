import React from 'react';
import { prefetchGetDatasetMetadata } from '@/api/buster_rest/datasets';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DatasetPageLayout } from './_DatasetsLayout';

export default async function Layout({
  params,
  children
}: {
  params: { datasetId: string };
  children: React.ReactNode;
}) {
  const queryClient = await prefetchGetDatasetMetadata(params.datasetId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DatasetPageLayout datasetId={params.datasetId}>{children}</DatasetPageLayout>
    </HydrationBoundary>
  );
}
