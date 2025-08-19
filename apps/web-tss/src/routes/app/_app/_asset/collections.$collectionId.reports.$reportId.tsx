import { createFileRoute } from '@tanstack/react-router';
import * as reportServerContext from '@/context/BusterAssets/reportServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/reports/$reportId'
)({
  ...reportServerContext,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/_app/_asset/collections/$collectionId/reports/$reportId"!</div>;
}
