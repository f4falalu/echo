import { createFileRoute, redirect } from '@tanstack/react-router';
import { preventBrowserCacheHeaders } from '@/middleware/shared-headers';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions/')({
  head: () => ({
    meta: [...preventBrowserCacheHeaders],
  }),
  beforeLoad: async ({ params }) => {
    throw redirect({
      to: '/app/datasets/$datasetId/permissions/overview',
      params,
      replace: true,
      statusCode: 307,
    });
  },
});
