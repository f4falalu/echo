import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { prefetchGetReportById } from '@/api/buster_rest/reports/queryRequests';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ReportPageController } from '@/controllers/ReportPageControllers';

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
      meta: [
        { title: loaderData?.title || 'Report' },
        { description: 'This is a report that was created by the good folks at Buster.so' },
      ],
    };
  },
});

function RouteComponent() {
  const { reportId } = Route.useParams();
  return (
    <ScrollArea className="min-h-screen bg-page-background">
      <ReportPageController reportId={reportId} readOnly />
    </ScrollArea>
  );
}
