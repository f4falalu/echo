import { createFileRoute } from '@tanstack/react-router';
import type { LayoutSize } from '@/components/ui/layouts/AppLayout';
import { DatasetEditorController } from '@/controllers/DatasetsControllers/DatasetEditorController/DatasetEditorController';

const defaultLayout: LayoutSize = ['auto', '170px'];
const autoSaveId = 'dataset-editor';

export const Route = createFileRoute('/app/_app/datasets/$datasetId/editor')({
  component: RouteComponent,
  loader: async ({ context }) => {
    const initialLayout = await context.getAppLayout({ id: 'dataset-editor' });
    return {
      initialLayout,
    };
  },
});

function RouteComponent() {
  const { initialLayout } = Route.useLoaderData();
  const { datasetId } = Route.useParams();
  return (
    <DatasetEditorController
      defaultLayout={defaultLayout}
      initialLayout={initialLayout}
      datasetId={datasetId}
      autoSaveId={autoSaveId}
    />
  );
}
