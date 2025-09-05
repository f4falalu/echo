import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { DataSourceTypes } from '@/api/asset_interfaces/datasources';
import { DataSourcesAddController } from '@/controllers/DataSourcesAddController/DataSourcesAddController';

const searchParamsSchema = z.object({
  type: z.nativeEnum(DataSourceTypes).optional(),
});

export const Route = createFileRoute(
  '/app/_settings/_restricted_layout/_admin_only/settings/datasources/add'
)({
  validateSearch: searchParamsSchema,
  component: RouteComponent,
});

function RouteComponent() {
  const { type } = Route.useSearch();
  return <DataSourcesAddController type={type} />;
}
