import { useBusterMetricDataContextSelector } from '@/context/MetricData';
import { useDashboardIndividualContextSelector } from '../DashboardInvididualContext';
import { useEffect, useRef } from 'react';
import { useInViewport } from 'ahooks';
import { useBusterMetricIndividual } from '@/context/Metrics';

export const useDashboardMetric = ({ metricId }: { metricId: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inViewport] = useInViewport(ref, {
    threshold: 0.25
  });

  const { metric, metricData } = useBusterMetricIndividual({ metricId });

  const metricMetadata = useDashboardIndividualContextSelector(
    ({ metricMetadata }) => metricMetadata[metricId]
  );

  const setInitialAnimationEnded = useDashboardIndividualContextSelector(
    ({ setInitialAnimationEnded }) => setInitialAnimationEnded
  );

  const setHasBeenScrolledIntoView = useDashboardIndividualContextSelector(
    ({ setHasBeenScrolledIntoView }) => setHasBeenScrolledIntoView
  );

  const initialAnimationEnded = metricMetadata?.initialAnimationEnded || false;
  const renderChart = metricMetadata?.hasBeenScrolledIntoView || false;

  useEffect(() => {
    if (inViewport) {
      setHasBeenScrolledIntoView(metricId);
    }
  }, [inViewport]);

  return { renderChart, metric, ref, metricData, initialAnimationEnded, setInitialAnimationEnded };
};
