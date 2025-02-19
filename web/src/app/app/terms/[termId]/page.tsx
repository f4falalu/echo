import React from 'react';
import { getAppSplitterLayout } from '@/components/layout';
import { TermIndividualController } from '@controllers/TermIndividualController';

export default async function TermIdPage({ params: { termId } }: { params: { termId: string } }) {
  const termPageIdLayout = await getAppSplitterLayout('term-page', ['auto', '300px']);

  return <TermIndividualController termPageIdLayout={termPageIdLayout} termId={termId} />;
}
