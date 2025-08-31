import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import * as dashboardServerContext from '@/context/BusterAssets/dashboard-server/dashboardLayoutServerAssetContext';

export const Route = createFileRoute(
  '/app/_app/_asset/collections/$collectionId/chats/$chatId/dashboards/$dashboardId'
)({
  ...dashboardServerContext,
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/app/collections/$collectionId/chats/$chatId/dashboards/$dashboardId"!</div>;
}
