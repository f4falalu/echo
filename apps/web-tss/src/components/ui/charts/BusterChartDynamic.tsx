import { ClientOnly } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';
import { PreparingYourRequestLoader } from './LoadingComponents/ChartLoadingComponents';

const BusterChartLazy = lazy(() =>
  import('./BusterChart').then((mod) => ({ default: mod.BusterChart }))
);

export const BusterChartDynamic = (props: Parameters<typeof BusterChartLazy>[0]) => (
  <Suspense fallback={<PreparingYourRequestLoader text="Loading chart..." />}>
    <ClientOnly>
      <BusterChartLazy {...props} />
    </ClientOnly>
  </Suspense>
);
