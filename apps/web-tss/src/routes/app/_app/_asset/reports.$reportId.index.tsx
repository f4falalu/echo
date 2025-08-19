import { createFileRoute } from '@tanstack/react-router';
import * as reportServerContext from '@/context/BusterAssets/reportServerAssetContext';

export const Route = createFileRoute('/app/_app/_asset/reports/$reportId/')({
  component: RouteComponent,
  ...reportServerContext,
});

function RouteComponent() {
  return <div>Hello "/app/reports/$reportId"!</div>;
}
