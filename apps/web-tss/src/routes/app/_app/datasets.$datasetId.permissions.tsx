import { createFileRoute, Outlet } from '@tanstack/react-router';
import { DatasetPermissionLayout } from '@/controllers/DatasetsControllers/DatasetPermissions/DatasetPermissionLayout';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/permissions')({
  component: RouteComponent,
});

function RouteComponent() {
  const { datasetId } = Route.useParams();
  return (
    <DatasetPermissionLayout datasetId={datasetId}>
      <Outlet />
    </DatasetPermissionLayout>
  );
}
