import { ThreadContentController } from '@/app/app/_controllers/ThreadController';
import { AppAssetCheckLayout } from '../../../../_layouts/AppAssetCheckLayout';
import { getAppSplitterLayout } from '@/components/layout';
import React from 'react';

export default async function CollectionThreadPage({
  params: { threadId, collectionId }
}: {
  params: {
    threadId: string;
    collectionId: string;
  };
}) {
  const threadLayout = await getAppSplitterLayout('thread', ['auto', '360px']);

  return (
    <AppAssetCheckLayout threadId={threadId} type="thread">
      <ThreadContentController threadId={threadId} threadLayout={threadLayout} />
    </AppAssetCheckLayout>
  );
}
