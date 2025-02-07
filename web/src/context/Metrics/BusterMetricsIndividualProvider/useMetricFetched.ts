import { useBusterMetricsIndividualContextSelector } from './BusterMetricsIndividualProvider';

export const useMetricFetched = ({ metricId }: { metricId: string }) => {
  const fetched = useBusterMetricsIndividualContextSelector((x) => x.metrics[metricId]?.fetched);
  const fetching = useBusterMetricsIndividualContextSelector((x) => x.metrics[metricId]?.fetching);
  const error = useBusterMetricsIndividualContextSelector((x) => x.metrics[metricId]?.error);

  return { fetched, fetching, error };
};
