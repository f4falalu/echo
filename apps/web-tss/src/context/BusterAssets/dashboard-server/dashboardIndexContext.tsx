import { redirect } from '@tanstack/react-router';

export const beforeLoad = ({
  params,
  search,
}: {
  params: { dashboardId: string };
  search: { dashboard_version_number?: number };
}) => {
  throw redirect({
    to: 'content',
    from: undefined as unknown as '/app/dashboards/$dashboardId/',
    params,
    search,
    unsafeRelative: 'path',
  });
};
