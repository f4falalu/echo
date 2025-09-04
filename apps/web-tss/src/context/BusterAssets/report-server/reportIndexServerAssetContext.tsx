import { redirect } from '@tanstack/react-router';

export const beforeLoad = ({
  params,
  search,
}: {
  params: { reportId: string };
  search: { report_version_number?: number };
}) => {
  throw redirect({
    to: 'content',
    from: undefined as unknown as '/app/reports/$reportId/',
    params,
    search,
    unsafeRelative: 'path',
  });
};
