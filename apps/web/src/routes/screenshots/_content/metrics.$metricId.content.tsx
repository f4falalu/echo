import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { useGetUserBasicInfo } from '@/api/buster_rest/users/useGetUserInfo';
import { Route as ScreenshotsRoute } from '../_content';
import { GetMetricScreenshotQuerySchema } from '../metrics.$metricId.index';

export const Route = createFileRoute('/screenshots/_content/metrics/$metricId/content')({
  component: RouteComponent,
  validateSearch: GetMetricScreenshotQuerySchema,
  ssr: true,
});

function RouteComponent() {
  const { version_number, type, width, height } = Route.useSearch();
  const { user } = ScreenshotsRoute.useLoaderData();
  const x = useGetUserBasicInfo();

  return (
    <div className="p-10 flex flex-col h-full border-red-500 border-10 items-center justify-center bg-blue-100 text-2xl text-blue-500">
      <div> Hello "/screenshot/hello-world"!</div>
      <div className="truncate max-w-[300px]">{x?.name}</div>
      <div className="truncate max-w-[300px]">{user.accessToken}</div>
    </div>
  );
}
