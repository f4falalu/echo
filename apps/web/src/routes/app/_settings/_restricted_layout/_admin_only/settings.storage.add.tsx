import { StorageProviderSchema } from '@buster/server-shared/s3-integrations';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { StorageAddController } from '@/controllers/StorageControllers/StorageAddController';

const searchParamsSchema = z.object({
  type: StorageProviderSchema.optional(),
});

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/storage/add'
)({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
});

function RouteComponent() {
  const { type } = Route.useSearch();
  return <StorageAddController type={type} />;
}
