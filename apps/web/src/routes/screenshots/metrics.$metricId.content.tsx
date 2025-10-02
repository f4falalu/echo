import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { GetMetricScreenshotQuerySchema } from './metrics.$metricId.index';

export const Route = createFileRoute('/screenshots/metrics/$metricId/content')({
  component: RouteComponent,
  validateSearch: GetMetricScreenshotQuerySchema,
  ssr: true,
});

function RouteComponent() {
  const { version_number, type, width, height } = Route.useSearch();

  return (
    <div className="p-10 flex flex-col h-full border-red-500 border-10 items-center justify-center bg-blue-100 text-2xl text-blue-500">
      Hello "/screenshot/hello-world"!
    </div>
  );
}
