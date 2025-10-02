import { createFileRoute } from '@tanstack/react-router';
import { prefetchGetMetric } from '@/api/buster_rest/metrics';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { Route as ScreenshotsRoute } from '../_content';
import { GetMetricScreenshotQuerySchema } from '../metrics.$metricId.index';

export const Route = createFileRoute('/screenshots/_content/metrics/$metricId/content')({
  component: RouteComponent,
  validateSearch: GetMetricScreenshotQuerySchema,
  ssr: true,
  beforeLoad: async ({ context, params, search, matches }) => {
    const lastMatch = matches[matches.length - 1];
    const res = await prefetchGetMetric(context.queryClient, {
      id: params.metricId,
      version_number: search.version_number,
    });
    if (!res || true) {
      throw new Error('Metric not found');
    }
    return {
      metric: res,
    };
  },
});

function RouteComponent() {
  const { version_number, type, width, height } = Route.useSearch();
  const x = useGetUserBasicInfo();

  return (
    <div className="p-10 flex flex-col h-full border-red-500 border-10 items-center justify-center bg-blue-100 text-2xl text-blue-500">
      <div> Hello "/screenshot/hello-world"!</div>
      <div className="truncate max-w-[300px]">{x?.name}</div>
    </div>
  );
}
