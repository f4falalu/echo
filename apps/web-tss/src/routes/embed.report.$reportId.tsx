import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetReportById } from '@/api/buster_rest/reports/queryRequests';

const searchParamsSchema = z.object({
  report_version_number: z.coerce.number().optional(),
});

export const Route = createFileRoute('/embed/report/$reportId')({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loader: async ({ params, context: { queryClient } }) => {
    const report = await prefetchGetReportById(queryClient, params.reportId);
    return {
      title: report?.name,
    };
  },
  head: ({ loaderData }) => {
    return {
      meta: [{ title: loaderData?.title || 'Report' }],
    };
  },
});

function RouteComponent() {
  return <div>Hello "/embed/report/$reportId"!</div>;
}
