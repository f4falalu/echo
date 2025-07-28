'use client';

import dynamic from 'next/dynamic';
import { PreparingYourRequestLoader } from './LoadingComponents/ChartLoadingComponents';

export const BusterChartDynamic = dynamic(
  () => import('./BusterChart').then((mod) => ({ default: mod.BusterChart })),
  {
    ssr: false,
    loading: () => <PreparingYourRequestLoader />
  }
);
