import { createFileRoute } from '@tanstack/react-router';
import { DatasetOverviewController } from '@/controllers/DatasetsControllers/DatasetOverviewController';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/overview')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DatasetOverviewController />;
}
