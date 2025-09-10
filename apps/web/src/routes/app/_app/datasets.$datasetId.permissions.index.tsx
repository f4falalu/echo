import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions/')({
  beforeLoad: async ({ params }) => {
    throw redirect({
      to: '/app/datasets/$datasetId/permissions/overview',
      params,
      replace: true,
      statusCode: 307,
    });
  },
});
