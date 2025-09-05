import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/app/_settings/_permissions/settings/dataset-groups/$datasetGroupId/'
)({
  beforeLoad: async ({ params }) => {
    throw redirect({
      to: '/app/settings/dataset-groups/$datasetGroupId/datasets',
      params,
    });
  },
});
