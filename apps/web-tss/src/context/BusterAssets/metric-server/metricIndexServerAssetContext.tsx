import { redirect } from '@tanstack/react-router';

export const beforeLoad = ({
  params,
  search,
}: {
  params: { metricId: string };
  search: { metric_version_number?: number };
}) => {
  throw redirect({
    to: 'chart',
    from: '/app/metrics/$metricId/',
    params,
    search,
  });
};
