import { useDashboardContentControllerContextSelector } from '../DashboardContentControllerContext';
import { useEffect, useMemo, useRef } from 'react';
import { useInViewport } from 'ahooks';
import { useMetricIndividual } from '@/context/Metrics';

export const useDashboardMetric = ({ metricId }: { metricId: string }) => {
  const { metric, metricData, metricDataUpdatedAt, isFetchedMetricData } = useMetricIndividual({
    metricId
  });
  const dashboard = useDashboardContentControllerContextSelector(({ dashboard }) => dashboard);
  const metricMetadata = useDashboardContentControllerContextSelector(
    ({ metricMetadata }) => metricMetadata[metricId]
  );
  const setInitialAnimationEnded = useDashboardContentControllerContextSelector(
    ({ setInitialAnimationEnded }) => setInitialAnimationEnded
  );
  const setHasBeenScrolledIntoView = useDashboardContentControllerContextSelector(
    ({ setHasBeenScrolledIntoView }) => setHasBeenScrolledIntoView
  );

  const isOnFirstTwoRows = useMemo(() => {
    return dashboard.config.rows
      ?.slice(0, 2)
      .some((row) => row.items.some((item) => item.id === metricId));
  }, [dashboard?.id]);

  const conatinerRef = useRef<HTMLDivElement>(null);
  const [inViewport] = useInViewport(conatinerRef, {
    threshold: 0.33
  });

  const initialAnimationEnded = metricMetadata?.initialAnimationEnded || false;
  const renderChart =
    (metricMetadata?.hasBeenScrolledIntoView || isOnFirstTwoRows) && metric?.fetched;

  useEffect(() => {
    if (inViewport) {
      setHasBeenScrolledIntoView(metricId);
    }
  }, [inViewport]);

  return {
    renderChart,
    metric,
    conatinerRef,
    metricData,
    initialAnimationEnded,
    setInitialAnimationEnded,
    metricDataUpdatedAt,
    isFetchedMetricData
  };
};
