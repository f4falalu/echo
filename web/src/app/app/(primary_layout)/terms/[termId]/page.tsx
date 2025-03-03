import React from 'react';
import { TermIndividualController } from '@controllers/TermIndividualController';
import { getAppSplitterLayout } from '@/components/ui/layouts';

export default async function TermIdPage({ params: { termId } }: { params: { termId: string } }) {
  const termPageIdLayout = await getAppSplitterLayout('term-page', ['auto', '300px']);

  return <TermIndividualController termPageIdLayout={termPageIdLayout} termId={termId} />;
}
